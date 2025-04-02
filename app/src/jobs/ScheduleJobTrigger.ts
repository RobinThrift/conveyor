import { BaseContext, type Context } from "@/lib/context"
import type { Duration } from "@/lib/duration"

import type { Job, JobTrigger } from "./types"

export class ScheduleJobTrigger implements JobTrigger {
    public name = "ScheduleJobTrigger"
    private _jobs: Job[] = []
    private _schedule: Duration
    private _baseCtx: Context
    private _handle?: ReturnType<typeof setInterval>

    constructor(schedule: Duration, baseCtx: Context = BaseContext) {
        this._schedule = schedule
        this._baseCtx = baseCtx
    }

    public start(): void {
        this._handle = setInterval(() => {
            this._run()
        }, this._schedule)
    }

    public stop(): void {
        if (this._handle) {
            clearInterval(this._handle)
            this._handle = undefined
        }
    }

    public registerJob(job: Job): void {
        this._jobs.push(job)
    }

    private _run() {
        let [ctx, cancel] = this._baseCtx.withCancel()
        for (let job of this._jobs) {
            job.run(ctx)
        }
        cancel()
    }
}
