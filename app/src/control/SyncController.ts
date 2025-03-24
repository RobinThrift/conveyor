import { type AccountKey, PrimaryAccountKeyName } from "@/domain/AccountKey"
import type {
    AttachmentChangelogEntry,
    ChangelogEntry,
    ChangelogEntryID,
    ChangelogEntryList,
    ChangelogTargetType,
    EncryptedChangelogEntry,
    MemoChangelogEntry,
    SettingChangelogEntry,
} from "@/domain/Changelog"
import type { SyncInfo } from "@/domain/SyncInfo"
import { dataFromBase64, encodeToBase64 } from "@/lib/base64"
import type { Context } from "@/lib/context"
import type { DBExec, Transactioner } from "@/lib/database"
import type { FS } from "@/lib/fs"
import { parseJSON, parseJSONDate } from "@/lib/json"
import { type AsyncResult, Err, Ok, all, fmtErr } from "@/lib/result"
import { encodeText } from "@/lib/textencoding"

import type { CryptoController } from "./CryptoController"

export class SyncController {
    private _transactioner: Transactioner
    private _storage: Storage
    private _syncAPIClient: SyncAPIClient
    private _cryptoRemoteAPI: CryptoRemoteAPI
    private _memos: Memo
    private _attachments: Attachments
    private _settings: Settings
    private _changelog: Changelog
    private _dbPath: string
    private _fs: FS
    private _crypto: CryptoController

    private _info: SyncInfo = { isEnabled: false }

    constructor({
        transactioner,
        storage,
        syncAPIClient,
        memos,
        attachments,
        settings,
        changelog,
        dbPath,
        fs,
        crypto,
        cryptoRemoteAPI,
    }: {
        transactioner: Transactioner
        storage: Storage
        syncAPIClient: SyncAPIClient
        memos: Memo
        attachments: Attachments
        settings: Settings
        changelog: Changelog
        dbPath: string
        fs: FS
        crypto: CryptoController
        cryptoRemoteAPI: CryptoRemoteAPI
    }) {
        this._transactioner = transactioner
        this._storage = storage
        this._syncAPIClient = syncAPIClient
        this._memos = memos
        this._attachments = attachments
        this._settings = settings
        this._changelog = changelog
        this._dbPath = dbPath
        this._fs = fs
        this._crypto = crypto
        this._cryptoRemoteAPI = cryptoRemoteAPI
    }

    public async init(
        ctx: Context,
        info: { server: string; clientID: string; username: string },
    ): AsyncResult<void> {
        this._info = { ...info, isEnabled: true }
        this._syncAPIClient.setBaseURL(info.server)

        let registered = await this._syncAPIClient.registerClient(ctx, {
            clientID: info.clientID,
        })
        if (!registered.ok) {
            return registered
        }

        return this._storage.saveSyncInfo(ctx, this._info)
    }

    public async reset(ctx: Context): AsyncResult<void> {
        this._info = { isEnabled: false }
        return this._storage.removeSyncInfo(ctx)
    }

    public async load(ctx: Context): AsyncResult<SyncInfo | undefined> {
        let info = await this._storage.loadSyncInfo(ctx)
        if (!info.ok) {
            return info
        }

        if (info.value?.isEnabled) {
            this._syncAPIClient.setBaseURL(info.value.server)
        }

        this._info = info.value ?? this._info

        return Ok(info.value)
    }

    public async sync(ctx: Context): AsyncResult<void> {
        let info = this._info
        if (!info.isEnabled) {
            return Err(new Error("sync is not enabled"))
        }

        let accountKeyUpload = await this._uploadAccountKey(ctx)
        if (!accountKeyUpload.ok) {
            return accountKeyUpload
        }

        return this._transactioner.inTransaction(ctx, async (ctx) => {
            let serverChanges = await this._fetchChangelogEntries(ctx)
            if (!serverChanges.ok) {
                return serverChanges
            }

            let [applyChanges, uploaded] = await Promise.all([
                this._applyChangelogEntries(ctx),
                this._uploadChangelogEntries(ctx),
            ])
            if (!applyChanges.ok) {
                return applyChanges
            }

            if (!uploaded.ok) {
                return uploaded
            }

            return this._storage.saveSyncInfo(ctx, {
                ...info,
                lastSyncedAt: new Date(),
            })
        })
    }

    public async fetchFullDB(ctx: Context): AsyncResult<void> {
        let data = await this._syncAPIClient.getFullSync(ctx)
        if (!data.ok) {
            return data
        }

        let decrypted = await this._crypto.decryptData(
            new Uint8Array(data.value),
        )
        if (!decrypted.ok) {
            return fmtErr(
                "error fetching full DB from sync server: error decrypting data: %w",
                decrypted,
            )
        }

        let written = await this._fs.write(ctx, this._dbPath, decrypted.value)
        if (!written.ok) {
            return fmtErr(
                `error fetching full DB from sync server: error writing data: ${this._dbPath}: %w`,
                written,
            )
        }

        return Ok(undefined)
    }

    public async uploadFullDB(ctx: Context): AsyncResult<void> {
        let accountKeyUpload = await this._uploadAccountKey(ctx)
        if (!accountKeyUpload.ok) {
            return accountKeyUpload
        }

        let data = await this._fs.read(ctx, this._dbPath)
        if (!data.ok) {
            return fmtErr(
                `error uploading full DB to sync server: error reading data from file: ${this._dbPath}: %w`,
                data,
            )
        }

        let encrypted = await this._crypto.encryptData(
            new Uint8Array(data.value),
        )
        if (!encrypted.ok) {
            return fmtErr(
                "error uploading full DB to sync server: error encrypting data: %w",
                encrypted,
            )
        }

        return this._syncAPIClient.uploadFullSyncData(ctx, encrypted.value)
    }

    private async _uploadAccountKey(ctx: Context): AsyncResult<void> {
        let publicKey = this._crypto.publicKey
        if (!publicKey.ok) {
            return publicKey
        }

        return this._cryptoRemoteAPI.uploadAccountKey(ctx, {
            name: PrimaryAccountKeyName,
            type: publicKey.value.type,
            data: encodeText(publicKey.value.data).buffer as ArrayBuffer,
        })
    }

    private async _applyChangelogEntries(ctx: Context): AsyncResult<void> {
        let groupedByType: Partial<
            Record<ChangelogTargetType, ChangelogEntry[]>
        > = {}

        let entryIDs = [] as ChangelogEntryID[]

        let hasNextPage = true
        let after: Date | undefined
        while (hasNextPage) {
            let page = await this._changelog.listUnapplidChangelogEntries(ctx, {
                pagination: {
                    pageSize: 50,
                    after,
                },
            })
            if (!page.ok) {
                return page
            }

            for (let entry of page.value.items) {
                entryIDs.push(entry.id)
                let entries = groupedByType[entry.targetType] ?? []
                entries.push(entry)
                groupedByType[entry.targetType] = entries
            }

            after = page.value.next
            hasNextPage = page.value.next !== undefined
        }

        return this._transactioner.inTransaction(ctx, async (ctx) => {
            if (groupedByType.attachments) {
                let applied = await this._attachments.applyChangelogEntries(
                    ctx,
                    groupedByType.attachments as AttachmentChangelogEntry[],
                )
                if (!applied.ok) {
                    return applied
                }
            }

            if (groupedByType.memos) {
                let applied = await this._memos.applyChangelogEntries(
                    ctx,
                    groupedByType.memos as MemoChangelogEntry[],
                )
                if (!applied.ok) {
                    return applied
                }
            }

            if (groupedByType.settings) {
                let applied = await this._settings.applyChangelogEntries(
                    ctx,
                    groupedByType.settings as SettingChangelogEntry[],
                )
                if (!applied.ok) {
                    return applied
                }
            }

            return this._changelog.markChangelogEntriesAsApplied(ctx, entryIDs)
        })
    }

    private async _fetchChangelogEntries(
        ctx: Context,
        since?: Date,
    ): AsyncResult<void> {
        let encrytpedEntries = await this._syncAPIClient.listChangelogEntries(
            ctx,
            since,
        )
        if (!encrytpedEntries.ok) {
            return encrytpedEntries
        }

        let entries = await this._decryptChangeLogEntries(
            encrytpedEntries.value,
        )
        if (!entries.ok) {
            return entries
        }

        return this._changelog.insertExternalChangelogEntries(
            ctx,
            entries.value,
        )
    }

    private async _uploadChangelogEntries(ctx: Context): AsyncResult<void> {
        let hasNextPage = true
        let after: Date | undefined
        while (hasNextPage) {
            let page = await this._changelog.listUnsyncedChangelogEntries(ctx, {
                pagination: {
                    pageSize: 50,
                    after,
                },
            })
            if (!page.ok) {
                return page
            }

            if (page.value.items.length === 0) {
                break
            }

            let uploaded = await this._uploadChangelogEntriesPage(
                ctx,
                page.value.items,
            )
            if (!uploaded.ok) {
                return uploaded
            }

            after = page.value.next
            hasNextPage = page.value.next !== undefined
        }

        return Ok(undefined)
    }

    private async _uploadChangelogEntriesPage(
        ctx: Context,
        entries: ChangelogEntry[],
    ): AsyncResult<void> {
        if (!this._info.isEnabled) {
            return Err(new Error("sync is not enabled"))
        }

        let clientID = this._info.clientID

        return this._transactioner.inTransaction(ctx, async (ctx) => {
            let marked = await this._changelog.markChangelogEntriesAsSynced(
                ctx,
                entries,
            )
            if (!marked.ok) {
                return marked
            }

            let encryped = await this._encryptChangeLogEntries(
                clientID,
                entries,
            )
            if (!encryped.ok) {
                return encryped
            }

            let uploaded = await this._syncAPIClient.uploadChangelogEntries(
                ctx,
                encryped.value,
            )
            if (!uploaded.ok) {
                return uploaded
            }

            let attachmentsUploaded = await all(
                entries
                    .filter((e) => e.targetType === "attachments")
                    .map((e) =>
                        this._uploadAttachment(
                            ctx,
                            e as AttachmentChangelogEntry,
                        ),
                    ),
            )
            if (!attachmentsUploaded.ok) {
                return attachmentsUploaded
            }

            return Ok(undefined)
        })
    }

    private async _encryptChangeLogEntries(
        clientID: string,
        entries: ChangelogEntry[],
    ): AsyncResult<EncryptedChangelogEntry[]> {
        let encrytpedEntries: EncryptedChangelogEntry[] = []

        for (let entry of entries) {
            let encrypted = await this._crypto.encryptData(
                encodeText(JSON.stringify(entry)),
            )
            if (!encrypted.ok) {
                return fmtErr("error encrytping changelog entry: %w", encrypted)
            }

            encrytpedEntries.push({
                syncClientID: clientID,
                data: encodeToBase64(new Uint8Array(encrypted.value)),
                timestamp: entry.timestamp,
            })
        }

        return Ok(encrytpedEntries)
    }

    private async _decryptChangeLogEntries(
        encrytpedEntries: EncryptedChangelogEntry[],
    ): AsyncResult<ChangelogEntry[]> {
        let entries: ChangelogEntry[] = []

        for (let entry of encrytpedEntries) {
            let decrypted = await this._crypto.decryptData(
                dataFromBase64(entry.data),
            )
            if (!decrypted.ok) {
                return fmtErr("error decrytping changelog entry: %w", decrypted)
            }

            let parsed = parseJSON<ChangelogEntry, Record<string, any>>(
                decrypted.value,
                (obj) => {
                    // let appliedAt = parseJSONDate(obj.appliedAt)
                    // if (!appliedAt.ok) {
                    //     return appliedAt
                    // }
                    let timestamp = parseJSONDate(obj.timestamp)
                    if (!timestamp.ok) {
                        return timestamp
                    }

                    return Ok({
                        id: obj.id,
                        source: obj.source,
                        revision: obj.revision,
                        targetType: obj.targetType,
                        targetID: obj.targetID,
                        value: obj.value,
                        isSynced: true,
                        isApplied: false,
                        timestamp: timestamp.value,
                    })
                },
            )

            if (!parsed.ok) {
                return parsed
            }

            entries.push(parsed.value)
        }

        return Ok(entries)
    }

    private async _uploadAttachment(
        ctx: Context,
        entry: AttachmentChangelogEntry,
    ): AsyncResult<void> {
        if (!this._info.isEnabled) {
            return Err(new Error("sync is not enabled"))
        }

        if (!("created" in entry.value)) {
            return Ok(undefined)
        }

        let data = await this._fs.read(ctx, entry.value.created.filepath)
        if (!data.ok) {
            return fmtErr(
                "error uploading attachment: error reading data: %w",
                data,
            )
        }

        return this._syncAPIClient.uploadAttachment(ctx, {
            filepath: entry.value.created.filepath,
            data: new Uint8Array(data.value),
        })
    }
}

interface SyncAPIClient {
    setBaseURL(baseURL: string): void
    registerClient(
        ctx: Context,
        syncClient: { clientID: string },
    ): AsyncResult<void>
    getFullSync(ctx: Context): AsyncResult<ArrayBufferLike>
    uploadFullSyncData(ctx: Context, data: ArrayBufferLike): AsyncResult<void>
    listChangelogEntries(
        ctx: Context,
        since?: Date,
    ): AsyncResult<EncryptedChangelogEntry[]>
    uploadChangelogEntries(
        ctx: Context,
        entries: EncryptedChangelogEntry[],
    ): AsyncResult<void>
    uploadAttachment(
        ctx: Context,
        attachment: {
            filepath: string
            data: Uint8Array<ArrayBufferLike>
        },
    ): AsyncResult<void>
}

interface Storage {
    loadSyncInfo(ctx: Context): AsyncResult<SyncInfo | undefined>
    saveSyncInfo(ctx: Context, info: SyncInfo): AsyncResult<void>
    removeSyncInfo(ctx: Context): AsyncResult<void>
}

interface Memo {
    applyChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        entries: MemoChangelogEntry[],
    ): AsyncResult<void>
}

interface Attachments {
    applyChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        entries: AttachmentChangelogEntry[],
    ): AsyncResult<void>
}

interface Settings {
    applyChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        entries: SettingChangelogEntry[],
    ): AsyncResult<void>
}

interface Changelog {
    insertExternalChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        entries: ChangelogEntry[],
    ): AsyncResult<void>

    listUnsyncedChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        args: {
            pagination: {
                pageSize: number
                after?: Date
            }
        },
    ): AsyncResult<ChangelogEntryList>

    listUnapplidChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        args: {
            pagination: {
                pageSize: number
                after?: Date
            }
        },
    ): AsyncResult<ChangelogEntryList>

    markChangelogEntriesAsApplied(
        ctx: Context<{ db?: DBExec }>,
        entryIDs: ChangelogEntryID[],
    ): AsyncResult<void>

    markChangelogEntriesAsSynced(
        ctx: Context<{ db?: DBExec }>,
        entries: ChangelogEntry[],
    ): AsyncResult<void>
}

interface CryptoRemoteAPI {
    uploadAccountKey(ctx: Context, accountKey: AccountKey): AsyncResult<void>
}
