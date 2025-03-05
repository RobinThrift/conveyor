import type {
    AttachmentChangelogEntry,
    ChangelogEntry,
    ChangelogEntryList,
    EncryptedChangelogEntry,
    MemoChangelogEntry,
    SettingChangelogEntry,
} from "@/domain/Changelog"
import type { Context } from "@/lib/context"
import { type CryptoKey, decryptData, encryptData } from "@/lib/crypto"
import { withTx, type Database, type DBExec } from "@/lib/database"
import type { FS } from "@/lib/fs"
import {
    Err,
    fmtErr,
    fromThrowing,
    Ok,
    type Result,
    type AsyncResult,
} from "@/lib/result"
import { decodeText, encodeText } from "@/lib/textencoding"

export class SyncEngine {
    public syncClientID: string
    private _syncAPIClient: SyncAPIClient
    private _db: Database
    private _memoStorage: MemoStorage
    private _attachmentStorage: AttachmentStorage
    private _settingsStorage: SettingsStorage
    private _changelog: ChangelogStorage
    private _dbPath: string
    private _fs: FS
    private _enckey: CryptoKey

    constructor({
        syncClientID,
        syncAPIClient,
        db,
        memoStorage,
        attachmentStorage,
        settingsStorage,
        changelog,
        dbPath,
        fs,
        enckey,
    }: {
        syncClientID: string
        syncAPIClient: SyncAPIClient
        db: Database
        memoStorage: MemoStorage
        attachmentStorage: AttachmentStorage
        settingsStorage: SettingsStorage
        changelog: ChangelogStorage
        dbPath: string
        fs: FS
        enckey: CryptoKey
    }) {
        this.syncClientID = syncClientID
        this._syncAPIClient = syncAPIClient
        this._db = db
        this._memoStorage = memoStorage
        this._attachmentStorage = attachmentStorage
        this._settingsStorage = settingsStorage
        this._changelog = changelog
        this._dbPath = dbPath
        this._fs = fs
        this._enckey = enckey
    }

    public async applyChangelogEntries(ctx: Context): AsyncResult<void> {
        let hasNextPage = true
        let after: number | undefined
        while (hasNextPage) {
            let page = await this._changelog.listUnapplidChangelogEntries(
                ctx.withData("db", undefined),
                {
                    pagination: {
                        pageSize: 50,
                        after,
                    },
                },
            )
            if (!page.ok) {
                return page
            }

            for (let entry of page.value.items) {
                let applied = await this._applyChangelogEntry(ctx, entry)
                if (!applied.ok) {
                    return applied
                }
            }

            after = page.value.next
            hasNextPage = page.value.next !== undefined
        }

        return Ok(undefined)
    }

    public async fetchFullDB(ctx: Context): AsyncResult<void> {
        let data = await this._syncAPIClient.getFullSync(ctx)
        if (!data.ok) {
            return data
        }

        let decrypted = await decryptData(
            this._enckey,
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
        let data = await this._fs.read(ctx, this._dbPath)
        if (!data.ok) {
            return fmtErr(
                `error uploading full DB to sync server: error reading data from file: ${this._dbPath}: %w`,
                data,
            )
        }

        let encrypted = await encryptData(
            this._enckey,
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

    public async fetchChangelogEntries(
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
            ctx.withData("db", undefined),
            entries.value,
        )
    }

    public async uploadChangelogEntries(ctx: Context): AsyncResult<void> {
        let hasNextPage = true
        let after: number | undefined
        while (hasNextPage) {
            let page = await this._changelog.listUnsyncedChangelogEntries(
                ctx.withData("db", undefined),
                {
                    pagination: {
                        pageSize: 50,
                        after,
                    },
                },
            )
            if (!page.ok) {
                return page
            }

            let uploaded = await this._uploadChangelogEntries(
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

    private async _uploadChangelogEntries(
        ctx: Context,
        entries: ChangelogEntry[],
    ): AsyncResult<void> {
        return withTx(ctx.withData("db", undefined), this._db, async (ctx) => {
            let marked = await this._changelog.markChangelogEntriesAsSynced(
                ctx,
                entries,
            )
            if (!marked.ok) {
                return marked
            }

            let encryped = await this._encryptChangeLogEntries(entries)
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

            return Ok(undefined)
        })
    }

    private async _encryptChangeLogEntries(
        entries: ChangelogEntry[],
    ): AsyncResult<EncryptedChangelogEntry[]> {
        let encrytpedEntries: EncryptedChangelogEntry[] = []

        for (let entry of entries) {
            let encrypted = await encryptData(
                this._enckey,
                encodeText(JSON.stringify(entry)),
            )
            if (!encrypted.ok) {
                return fmtErr("error encrytping changelog entry: %w", encrypted)
            }

            encrytpedEntries.push({
                syncClientID: this.syncClientID,
                data: Buffer.from(encrypted.value).toString("base64"),
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
            let decrypted = await decryptData(
                this._enckey,
                Buffer.from(entry.data, "base64"),
            )
            if (!decrypted.ok) {
                return fmtErr("error decrytping changelog entry: %w", decrypted)
            }

            let parsed = fromThrowing(() =>
                JSON.parse(decodeText(new Uint8Array(decrypted.value))),
            )
            if (!parsed.ok) {
                return parsed
            }

            entries.push(parsed.value)
        }

        return Ok(entries)
    }

    private async _applyChangelogEntry(
        ctx: Context,
        entry: ChangelogEntry,
    ): AsyncResult<void> {
        return withTx(ctx.withData("db", undefined), this._db, async (ctx) => {
            let applied: Result<void, Error>
            switch (entry.targetType) {
                case "memos":
                    applied = await this._memoStorage.applyChangelogEntry(
                        ctx,
                        entry as MemoChangelogEntry,
                    )
                    break
                case "attachments":
                    applied = await this._attachmentStorage.applyChangelogEntry(
                        ctx,
                        entry as AttachmentChangelogEntry,
                    )
                    break
                case "settings":
                    applied = await this._settingsStorage.applyChangelogEntry(
                        ctx,
                        entry as SettingChangelogEntry,
                    )
                    break
                default:
                    applied = Err(
                        new Error(
                            `unknown changelog entry target type ${entry.targetType}`,
                        ),
                    )
            }

            this._changelog.markChangelogEntriesAsApplied(ctx, [entry])

            if (!applied.ok) {
                return applied
            }

            return Ok(undefined)
        })
    }
}

interface SyncAPIClient {
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
}

interface MemoStorage {
    applyChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        entry: MemoChangelogEntry,
    ): AsyncResult<void>
}

interface AttachmentStorage {
    applyChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        entry: AttachmentChangelogEntry,
    ): AsyncResult<void>
}

interface SettingsStorage {
    applyChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        entry: SettingChangelogEntry,
    ): AsyncResult<void>
}

interface ChangelogStorage {
    insertExternalChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        entries: ChangelogEntry[],
    ): AsyncResult<void>

    listUnsyncedChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        args: {
            pagination: {
                pageSize: number
                after?: number
            }
        },
    ): AsyncResult<ChangelogEntryList>

    listUnapplidChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        args: {
            pagination: {
                pageSize: number
                after?: number
            }
        },
    ): AsyncResult<ChangelogEntryList>

    markChangelogEntriesAsApplied(
        ctx: Context<{ db?: DBExec }>,
        entries: ChangelogEntry[],
    ): AsyncResult<void>

    markChangelogEntriesAsSynced(
        ctx: Context<{ db?: DBExec }>,
        entries: ChangelogEntry[],
    ): AsyncResult<void>
}
