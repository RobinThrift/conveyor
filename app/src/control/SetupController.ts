import type { SetupInfo } from "@/domain/SetupInfo"
import type { SingleItemKVStore } from "@/lib/KVStore/SingleItemKVStore"
import type { Context } from "@/lib/context"
import type { AsyncResult } from "@/lib/result"

export class SetupController {
    static storageKey = "setup-info"

    private _storage: Storage

    constructor({ storage }: { storage: Storage }) {
        this._storage = storage
    }

    loadSetupInfo(ctx: Context): AsyncResult<SetupInfo | undefined> {
        return this._storage.getItem(ctx, SetupController.storageKey)
    }

    saveSetupInfo(ctx: Context, info: SetupInfo): AsyncResult<void> {
        return this._storage.setItem(ctx, SetupController.storageKey, info)
    }
}

type Storage = SingleItemKVStore<typeof SetupController.storageKey, SetupInfo>
