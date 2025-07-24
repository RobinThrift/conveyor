import type { SyncController } from "@/control/SyncController"
import type { Context } from "@/lib/context"
import { type AsyncResult, Ok } from "@/lib/result"

import type { Job } from "./types"

export class SyncJob implements Job {
    private _syncController: SyncController

    constructor({ syncController }: { syncController: SyncController }) {
        this._syncController = syncController
    }

    public async run(ctx: Context): AsyncResult<void> {
        if (!navigator.onLine) {
            return Ok()
        }

        return this._syncController.sync(ctx)
    }
}
