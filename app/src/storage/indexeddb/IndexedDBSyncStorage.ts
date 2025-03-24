import type { SyncInfo } from "@/domain/SyncInfo"
import { EncryptedBrowserIndexedDB } from "@/external/browser/EncryptedBrowserIndexedDB"
import type { Context } from "@/lib/context"
import type { Decrypter, Encrypter } from "@/lib/crypto"
import { parseJSON, parseJSONDate } from "@/lib/json"
import { type AsyncResult, Ok } from "@/lib/result"

const SYNC_INFO_KEY = "SyncInfo"

export class IndexedDBSyncStorage {
    private _db: EncryptedBrowserIndexedDB<SyncInfo>

    constructor(crypto: Encrypter & Decrypter) {
        this._db = new EncryptedBrowserIndexedDB<SyncInfo>({
            name: "SyncStorage",
            crypto,
            keyFrom: () => SYNC_INFO_KEY,
            parse: (raw) =>
                parseJSON<SyncInfo, Record<string, any>>(raw, (obj) => {
                    let lastSyncedAt = obj.lastSyncedAt
                        ? parseJSONDate(obj.lastSyncedAt)
                        : undefined
                    if (lastSyncedAt && !lastSyncedAt.ok) {
                        return lastSyncedAt
                    }

                    return Ok({
                        isEnabled: obj.isEnabled,
                        server: obj.server,
                        clientID: obj.clientID,
                        username: obj.username,
                        lastSyncedAt: lastSyncedAt?.value,
                    })
                }),
        })
    }

    open(ctx: Context): AsyncResult<void> {
        return this._db.open(ctx)
    }

    close() {
        return this._db.close()
    }

    loadSyncInfo(ctx: Context): AsyncResult<SyncInfo | undefined> {
        return this._db.get(ctx, SYNC_INFO_KEY)
    }

    saveSyncInfo(ctx: Context, info: SyncInfo): AsyncResult<void> {
        return this._db.insertOrUpdate(ctx, [info])
    }

    removeSyncInfo(ctx: Context): AsyncResult<void> {
        return this._db.delete(ctx, SYNC_INFO_KEY)
    }
}
