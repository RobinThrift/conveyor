import type { Temporal } from "temporal-polyfill"
import { type AccountKey, PrimaryAccountKeyName } from "@/domain/AccountKey"
import { ATTACHMENT_BASE_DIR } from "@/domain/Attachment"
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
import { Second } from "@/lib/duration"
import { createErrType } from "@/lib/errors"
import { type FS, join } from "@/lib/fs"
import { calendarDateTimeFromDate, temporalToDate } from "@/lib/i18n"
import { jsonDeserialize, parseJSONDate } from "@/lib/json"
import type { SingleItemKVStore } from "@/lib/KVStore/SingleItemKVStore"
import { type AsyncResult, all, Err, Ok, wrapErr } from "@/lib/result"
import { encodeText } from "@/lib/textencoding"
import type { CryptoController } from "./CryptoController"

export class SyncController {
    static storageKey = "sync-info"

    private _transactioner: Transactioner
    private _storage: Storage
    private _syncAPIClient: SyncAPIClient
    private _cryptoRemoteAPI: CryptoRemoteAPI
    private _memos: Memos
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
        memos: Memos
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

    public static ErrInit = createErrType("SyncController", "error initialising")
    public async init(
        ctx: Context,
        info: { server: string; clientID: string; username: string },
    ): AsyncResult<void> {
        this._info = { ...info, isEnabled: true }
        this._syncAPIClient.setBaseURL(info.server)

        let [_, registrationErr] = await this._syncAPIClient.registerClient(ctx, {
            clientID: info.clientID,
        })
        if (registrationErr) {
            return wrapErr`${new SyncController.ErrInit()}: ${registrationErr}`
        }

        return this._storage.setItem(ctx, SyncController.storageKey, this._info)
    }

    public static ErrReset = createErrType("SyncController", "error resetting")
    public async reset(ctx: Context): AsyncResult<void> {
        this._info = { isEnabled: false }
        let [_, err] = await this._storage.removeItem(ctx, SyncController.storageKey)
        if (err) {
            return wrapErr`${new SyncController.ErrReset()}: ${err}`
        }
        return Ok()
    }

    public static ErrLoad = createErrType("SyncController", "error loading sync info from storage")
    public async load(ctx: Context): AsyncResult<SyncInfo | undefined> {
        let [info, err] = await this._storage.getItem(ctx, SyncController.storageKey)
        if (err) {
            return wrapErr`${new SyncController.ErrLoad()}: ${err}`
        }

        if (info?.isEnabled) {
            this._syncAPIClient.setBaseURL(info.server)
        }

        this._info = info ?? this._info

        if (this._info?.isEnabled && typeof this._info.lastSyncedAt === "string") {
            this._info.lastSyncedAt = new Date(this._info.lastSyncedAt)
        }

        return Ok(info)
    }

    public static ErrSync = createErrType("SyncController", "error syncing")
    public async sync(ctx: Context): AsyncResult<void> {
        let info = this._info
        if (!info.isEnabled) {
            return wrapErr`${new SyncController.ErrSync()}: sync is not enabled`
        }

        let [_, accountKeyUploadErr] = await this._uploadAccountKey(ctx)
        if (accountKeyUploadErr) {
            return wrapErr`${new SyncController.ErrSync()}: error uploading account key: ${accountKeyUploadErr}`
        }

        return this._transactioner.inTransaction(ctx, async (ctx) => {
            let [_, fetchRemoteEntriesErr] = await this._fetchChangelogEntries(
                ctx,
                info.lastSyncedAt ? calendarDateTimeFromDate(info.lastSyncedAt) : undefined,
            )
            if (fetchRemoteEntriesErr) {
                return Err(fetchRemoteEntriesErr)
            }

            let [[_1, applyChangesErr], [_2, uploadErr]] = await Promise.all([
                this._applyChangelogEntries(ctx),
                this._uploadChangelogEntries(ctx),
            ])
            if (applyChangesErr) {
                return Err(applyChangesErr)
            }

            if (uploadErr) {
                return Err(uploadErr)
            }

            return this._storage.setItem(ctx, SyncController.storageKey, {
                ...info,
                lastSyncedAt: new Date(),
            })
        })
    }

    public static ErrFetchFullDB = createErrType("SyncController", "error fetching full database")
    public async fetchFullDB(ctx: Context): AsyncResult<void> {
        let [data, getFullSyncErr] = await this._syncAPIClient.getFullSync(ctx)
        if (getFullSyncErr) {
            return wrapErr`${new SyncController.ErrFetchFullDB()}: ${getFullSyncErr}`
        }

        let [decrypted, decryptionErr] = await this._crypto.decryptData(new Uint8Array(data))
        if (decryptionErr) {
            return wrapErr`${new SyncController.ErrFetchFullDB()}: error decrypting data: ${decryptionErr}`
        }

        let [_, writeErr] = await this._fs.write(ctx, this._dbPath, decrypted)
        if (writeErr) {
            return wrapErr`${new SyncController.ErrFetchFullDB()}: error writing file: ${this._dbPath}: ${writeErr}`
        }

        return Ok()
    }

    public static ErrUploadFullDB = createErrType("SyncController", "error uploading full database")
    public async uploadFullDB(ctx: Context): AsyncResult<void> {
        let [_, accountKeyUploadErr] = await this._uploadAccountKey(ctx)
        if (accountKeyUploadErr) {
            return wrapErr`${new SyncController.ErrUploadFullDB()}: ${accountKeyUploadErr}`
        }

        let [data, readDataErr] = await this._fs.read(ctx, this._dbPath)
        if (readDataErr) {
            return wrapErr`${new SyncController.ErrUploadFullDB()}: error reading data from file: ${this._dbPath}: ${readDataErr}`
        }

        let [encrypted, encryptionErr] = await this._crypto.encryptData(new Uint8Array(data))
        if (encryptionErr) {
            return wrapErr`${new SyncController.ErrUploadFullDB()}: error encrypting data: ${encryptionErr}`
        }

        return this._syncAPIClient.uploadFullSyncData(ctx, encrypted)
    }

    public static ErrUploadAccountKey = createErrType(
        "SyncController",
        "error uploading account key",
    )
    private async _uploadAccountKey(ctx: Context): AsyncResult<void> {
        let [publicKey, publicKeyErr] = this._crypto.publicKey
        if (publicKeyErr) {
            return wrapErr`${new SyncController.ErrUploadAccountKey()}: error error getting public key: ${publicKeyErr}`
        }

        let [_, err] = await this._cryptoRemoteAPI.uploadAccountKey(ctx, {
            name: PrimaryAccountKeyName,
            type: publicKey.type,
            data: encodeText(publicKey.data).buffer as ArrayBuffer,
        })
        if (err) {
            return wrapErr`${new SyncController.ErrUploadAccountKey()}: ${err}`
        }

        return Ok()
    }

    public static ErrApplyChangelogEntries = createErrType(
        "SyncController",
        "error applying changelog entries",
    )
    private async _applyChangelogEntries(ctx: Context): AsyncResult<void> {
        let groupedByType: Partial<Record<ChangelogTargetType, ChangelogEntry[]>> = {}

        let entryIDs = [] as ChangelogEntryID[]

        let hasNextPage = true
        let after: [number, Temporal.ZonedDateTime] | undefined
        while (hasNextPage) {
            let [page, pageErr] = await this._changelog.listUnapplidChangelogEntries(ctx, {
                pagination: {
                    pageSize: 50,
                    after,
                },
            })
            if (pageErr) {
                return wrapErr`${new SyncController.ErrApplyChangelogEntries()}: error getting unapplied changelog entries: ${pageErr}`
            }

            for (let entry of page.items) {
                entryIDs.push(entry.id)
                let entries = groupedByType[entry.targetType] ?? []
                entries.push(entry)
                groupedByType[entry.targetType] = entries
            }

            after = page.next
            hasNextPage = page.next !== undefined
        }

        return this._transactioner.inTransaction(ctx, async (ctx) => {
            if (groupedByType.attachments) {
                let [_, entryApplicationErr] = await this._attachments.applyChangelogEntries(
                    ctx,
                    groupedByType.attachments as AttachmentChangelogEntry[],
                )
                if (entryApplicationErr) {
                    return wrapErr`${new SyncController.ErrApplyChangelogEntries()}: error applying attachment changes: ${entryApplicationErr}`
                }
            }

            if (groupedByType.memos) {
                let [_, entryApplicationErr] = await this._memos.applyChangelogEntries(
                    ctx,
                    groupedByType.memos as MemoChangelogEntry[],
                )
                if (entryApplicationErr) {
                    return wrapErr`${new SyncController.ErrApplyChangelogEntries()}: error applying memo changes: ${entryApplicationErr}`
                }
            }

            if (groupedByType.settings) {
                let [_, entryApplicationErr] = await this._settings.applyChangelogEntries(
                    ctx,
                    groupedByType.settings as SettingChangelogEntry[],
                )
                if (entryApplicationErr) {
                    return wrapErr`${new SyncController.ErrApplyChangelogEntries()}: error applying settings changes: ${entryApplicationErr}`
                }
            }

            let [_, err] = await this._changelog.markChangelogEntriesAsApplied(ctx, entryIDs)
            if (err) {
                return wrapErr`${new SyncController.ErrApplyChangelogEntries()}: ${err}`
            }

            return Ok()
        })
    }

    public static ErrFetchChangelogEntries = createErrType(
        "SyncController",
        "error fetching changelog entries from sync server",
    )
    private async _fetchChangelogEntries(
        ctx: Context,
        since?: Temporal.ZonedDateTime,
    ): AsyncResult<void> {
        let [encrytpedEntries, fetchErr] = await this._syncAPIClient.listChangelogEntries(
            ctx,
            since,
        )
        if (fetchErr) {
            return wrapErr`${new SyncController.ErrFetchChangelogEntries()}: ${fetchErr}`
        }

        let [entries, decryptionErr] = await this._decryptChangeLogEntries(encrytpedEntries)
        if (decryptionErr) {
            return wrapErr`${new SyncController.ErrFetchChangelogEntries()}: ${decryptionErr}`
        }

        let [_, insertErr] = await this._changelog.insertExternalChangelogEntries(ctx, entries)
        if (insertErr) {
            return wrapErr`${new SyncController.ErrFetchChangelogEntries()}: ${insertErr}`
        }

        return Ok()
    }

    public static ErrUploadChangelogEntries = createErrType(
        "SyncController",
        "error uploading changelog entries to sync server",
    )
    private async _uploadChangelogEntries(ctx: Context): AsyncResult<void> {
        let hasNextPage = true
        let after: [number, Temporal.ZonedDateTime] | undefined
        while (hasNextPage) {
            let [page, pageErr] = await this._changelog.listUnsyncedChangelogEntries(ctx, {
                pagination: {
                    pageSize: 50,
                    after,
                },
            })
            if (pageErr) {
                return wrapErr`${new SyncController.ErrUploadChangelogEntries()}: error getting unsynced changes: ${pageErr}`
            }

            if (page.items.length === 0) {
                break
            }

            let [_, uploadErr] = await this._uploadChangelogEntriesPage(ctx, page.items)
            if (uploadErr) {
                return wrapErr`${new SyncController.ErrUploadChangelogEntries()}: ${uploadErr}`
            }

            after = page.next
            hasNextPage = page.next !== undefined
        }

        return Ok()
    }

    private async _uploadChangelogEntriesPage(
        ctx: Context,
        entries: ChangelogEntry[],
    ): AsyncResult<void> {
        if (!this._info.isEnabled) {
            return Err(new Error("sync is not enabled"))
        }

        let clientID = this._info.clientID
        let [ctxWithCancel, cancel] = ctx.withTimeout(Second * 120)

        let result = await this._transactioner.inTransaction(ctxWithCancel, async (ctx) => {
            let [_mark, markErr] = await this._changelog.markChangelogEntriesAsSynced(ctx, entries)
            if (markErr) {
                return wrapErr`error marking changelog entries as synced: ${markErr}`
            }

            let [encryped, encryptionErr] = await this._encryptChangeLogEntries(clientID, entries)
            if (encryptionErr) {
                return Err(encryptionErr)
            }

            let [_upload, uploadErr] = await this._syncAPIClient.uploadChangelogEntries(
                ctx,
                encryped,
            )
            if (uploadErr) {
                return wrapErr`upload error: ${uploadErr}`
            }

            let [_attachmentsUpload, attachmentsUploadErr] = await all(
                entries
                    .filter((e) => e.targetType === "attachments")
                    .map((e) => this._uploadAttachment(ctx, e as AttachmentChangelogEntry)),
            )
            if (attachmentsUploadErr) {
                return Err(attachmentsUploadErr)
            }

            return Ok()
        })
        cancel()
        return result
    }

    private async _encryptChangeLogEntries(
        clientID: string,
        entries: ChangelogEntry[],
    ): AsyncResult<EncryptedChangelogEntry[]> {
        let encrytpedEntries: EncryptedChangelogEntry[] = []

        for (let entry of entries) {
            let [encrypted, encryptionErr] = await this._crypto.encryptData(
                encodeText(JSON.stringify(entry)),
            )
            if (encryptionErr) {
                return wrapErr`error encrypting changelog entries: ${encryptionErr}`
            }

            encrytpedEntries.push({
                syncClientID: clientID,
                data: encodeToBase64(new Uint8Array(encrypted)),
                timestamp: temporalToDate(entry.timestamp),
            })
        }

        return Ok(encrytpedEntries)
    }

    private async _decryptChangeLogEntries(
        encrytpedEntries: EncryptedChangelogEntry[],
    ): AsyncResult<ChangelogEntry[]> {
        let entries: ChangelogEntry[] = []

        for (let entry of encrytpedEntries) {
            let [data, decodeErr] = dataFromBase64(entry.data)
            if (decodeErr) {
                return wrapErr`error decoding changelog entry base64 data: ${decodeErr}`
            }

            let [decrypted, decryptionErr] = await this._crypto.decryptData(data)
            if (decryptionErr) {
                return wrapErr`error decrytping changelog entry: ${decryptionErr}`
            }

            let [parsed, parseErr] = jsonDeserialize<ChangelogEntry, Record<string, any>>(
                decrypted,
                (obj) => {
                    let [timestamp, parseErr] = parseJSONDate(obj.timestamp)
                    if (parseErr) {
                        return wrapErr`error parsing timestamp: ${parseErr}`
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
                        timestamp: timestamp,
                    })
                },
            )

            if (parseErr) {
                return wrapErr`error deserializing changelog entry: ${parseErr}`
            }

            entries.push(parsed)
        }

        return Ok(entries)
    }

    public static ErrUploadAttachment = createErrType(
        "SyncController",
        "error uploading attachment to sync server",
    )
    private async _uploadAttachment(
        ctx: Context,
        entry: AttachmentChangelogEntry,
    ): AsyncResult<void> {
        if (!this._info.isEnabled) {
            return wrapErr`${new SyncController.ErrUploadAttachment()}: sync is not enabled`
        }

        if (!("created" in entry.value)) {
            return Ok()
        }

        let [data, readErr] = await this._fs.read(
            ctx,
            join(ATTACHMENT_BASE_DIR, entry.value.created.filepath),
        )
        if (readErr) {
            return wrapErr`${new SyncController.ErrUploadAttachment()}: ${entry.targetID}: ${entry.value.created.filepath}: error reading data: ${readErr}`
        }

        let [_, err] = await this._syncAPIClient.uploadAttachment(ctx, {
            filepath: entry.value.created.filepath,
            data: new Uint8Array(data),
        })
        if (err) {
            return wrapErr`${new SyncController.ErrUploadAttachment()}: ${entry.targetID}: ${entry.value.created.filepath}: upload error: ${err}`
        }

        return Ok()
    }
}

interface SyncAPIClient {
    setBaseURL(baseURL: string): void
    registerClient(ctx: Context, syncClient: { clientID: string }): AsyncResult<void>
    getFullSync(ctx: Context): AsyncResult<ArrayBuffer>
    uploadFullSyncData(ctx: Context, data: ArrayBuffer): AsyncResult<void>
    listChangelogEntries(
        ctx: Context,
        since?: Temporal.ZonedDateTime,
    ): AsyncResult<EncryptedChangelogEntry[]>
    uploadChangelogEntries(ctx: Context, entries: EncryptedChangelogEntry[]): AsyncResult<void>
    uploadAttachment(
        ctx: Context,
        attachment: {
            filepath: string
            data: Uint8Array<ArrayBuffer>
        },
    ): AsyncResult<void>
}

type Storage = SingleItemKVStore<typeof SyncController.storageKey, SyncInfo>

interface Memos {
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
                after?: [number, Temporal.ZonedDateTime]
            }
        },
    ): AsyncResult<ChangelogEntryList>

    listUnapplidChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        args: {
            pagination: {
                pageSize: number
                after?: [number, Temporal.ZonedDateTime]
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
