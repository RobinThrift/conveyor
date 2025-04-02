import { type AsyncResult, Ok } from "@/lib/result"
import { type AppDispatch, actions } from "@/ui/state"

import type { Job } from "./types"

export class SyncJob implements Job {
    public name = "SyncJob"

    private _dispatch: AppDispatch

    constructor(dispatch: AppDispatch) {
        this._dispatch = dispatch
    }

    public async run(): AsyncResult<void> {
        if (navigator.onLine) {
            this._dispatch(actions.sync.syncStart())
        }
        return Ok(undefined)
    }
}
