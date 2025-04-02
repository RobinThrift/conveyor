import type { Context } from "@/lib/context"
import type { AsyncResult } from "@/lib/result"

export interface Job {
    name: string
    run(ctx: Context): AsyncResult<void>
}

export interface JobRun {
    name: string
    run(ctx: Context): AsyncResult<void>
}

export interface JobTrigger {
    name: string
    start(): void
    stop(): void
    registerJob(job: Job): void
}
