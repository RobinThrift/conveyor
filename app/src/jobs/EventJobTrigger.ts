import { BaseContext, type Context } from "@/lib/context"

import type { Job, JobTrigger } from "./types"

export class EventJobTrigger<Target extends EventTarget> implements JobTrigger {
    public name = "EventJobTrigger"
    private _jobs: Job[] = []
    private _target: Target
    private _event: Parameters<Target["addEventListener"]>[0]
    private _baseCtx: Context
    private _unsub?: () => void

    constructor(
        eventTarget: Target,
        event: Parameters<Target["addEventListener"]>[0],
        baseCtx: Context = BaseContext,
    ) {
        this._target = eventTarget
        this._event = event
        this._baseCtx = baseCtx
    }

    public start(): void {
        let cb = () => {
            let [ctx, cancel] = this._baseCtx.withCancel()
            for (let job of this._jobs) {
                job.run(ctx)
            }
            cancel()
        }
        this._target.addEventListener(this._event, cb)
        this._unsub = () => {
            this._target.removeEventListener(this._event, cb)
            this._unsub = undefined
        }
    }

    public stop(): void {
        this._unsub?.()
    }

    public registerJob(job: Job): void {
        this._jobs.push(job)
    }
}
