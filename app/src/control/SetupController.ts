import type { SetupInfo } from "@/domain/SetupInfo"
import type { Context } from "@/lib/context"
import type { AsyncResult } from "@/lib/result"

export class SetupController {
    private _storage: Storage

    constructor({ storage }: { storage: Storage }) {
        this._storage = storage
    }

    loadSetupInfo(ctx: Context): AsyncResult<SetupInfo | undefined> {
        return this._storage.loadSetupInfo(ctx)
    }

    saveSetupInfo(ctx: Context, info: SetupInfo): AsyncResult<void> {
        return this._storage.saveSetupInfo(ctx, info)
    }
}

interface Storage {
    loadSetupInfo(ctx: Context): AsyncResult<SetupInfo | undefined>
    saveSetupInfo(ctx: Context, info: SetupInfo): AsyncResult<void>
}
