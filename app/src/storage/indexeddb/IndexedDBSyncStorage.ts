import type { SyncInfo } from "@/domain/SyncInfo"
import { EncryptedBrowserIndexedDB } from "@/external/browser/EncryptedBrowserIndexedDB"
import type { Context } from "@/lib/context"
import type { Crypto } from "@/lib/crypto"
import type { AsyncResult } from "@/lib/result"

export class IndexedDBSyncStorage {
    private _db: EncryptedBrowserIndexedDB<SyncInfo>

    constructor(crypto: Crypto) {
        this._db = new EncryptedBrowserIndexedDB<SyncInfo>({
            name: "SyncStorage",
            crypto,
            keyFrom: () => "sync_info",
        })
    }

    open(ctx: Context): AsyncResult<void> {
        return this._db.open(ctx)
    }

    close() {
        return this._db.close()
    }

    loadSyncInfo(ctx: Context): AsyncResult<SyncInfo | undefined> {
        return this._db.get(ctx, "SyncInfo")
    }

    saveSyncInfo(ctx: Context, info: SyncInfo): AsyncResult<void> {
        return this._db.insertOrUpdate(ctx, [info])
    }
}
