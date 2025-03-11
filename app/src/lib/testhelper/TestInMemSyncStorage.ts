import type { SyncInfo } from "@/domain/SyncInfo"
import type { Context } from "@/lib/context"
import { type AsyncResult, Ok } from "@/lib/result"

export class TestInMemSyncStorage {
    private _syncInfo: SyncInfo | undefined

    async loadSyncInfo(_: Context): AsyncResult<SyncInfo | undefined> {
        return Ok(this._syncInfo)
    }

    async saveSyncInfo(_: Context, info: SyncInfo): AsyncResult<void> {
        this._syncInfo = info
        return Ok(undefined)
    }
}
