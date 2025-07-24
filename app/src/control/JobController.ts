import type { CleanupJob } from "@/jobs/CleanupJob"
import type { ExportJob } from "@/jobs/ExportJob"
import type { FullSyncJob } from "@/jobs/FullSyncJob"
import type { SyncJob } from "@/jobs/SyncJob"
import { BaseContext, type Context } from "@/lib/context"
import type { Duration } from "@/lib/duration"
import { queueTask } from "@/lib/microtask"
import { type AsyncResult, Ok } from "@/lib/result"

type Jobs = {
    sync: SyncJob
    fullSync: FullSyncJob
    export: ExportJob
    cleanup: CleanupJob
}

export class JobController {
    private _registeredJobs: Partial<Jobs> = {}

    private _schedules: ReturnType<typeof setInterval>[] = []
    private _unsub: (() => void)[] = []

    private _events: {
        start: ((args: { name: string }) => void)[]
        end: ((args: { name: string }) => void)[]
        error: ((args: { name: string; error: Error }) => void)[]
    } = { start: [], end: [], error: [] }

    registerJob<Name extends keyof Jobs>(name: Name, job: Jobs[Name]) {
        this._registeredJobs[name] = job
    }

    scheduleJob<Name extends keyof Jobs>(name: Name, schedule: Duration) {
        this._schedules.push(
            setInterval(() => {
                this._runJob(BaseContext, name)
            }, schedule),
        )
    }

    triggerJobOnEvent<
        Name extends keyof Jobs,
        Target extends Pick<EventTarget, "addEventListener" | "removeEventListener">,
    >(name: Name, target: Target, event: Parameters<Target["addEventListener"]>[0]) {
        let cb = () => {
            this._runJob(BaseContext, name)
        }
        target.addEventListener(event, cb)
        this._unsub.push(() => {
            target.removeEventListener(event, cb)
        })
    }

    public async startJob<Name extends keyof Jobs>(ctx: Context, name: Name): AsyncResult<void>
    public async startJob<Name extends keyof Jobs>(
        ctx: Context,
        name: Name,
        params: Parameters<Jobs[Name]["run"]>[1],
    ): AsyncResult<void>
    public async startJob<Name extends keyof Jobs>(
        ctx: Context,
        name: Name,
        params?: Parameters<Jobs[Name]["run"]>[1],
    ): AsyncResult<void> {
        this._runJob(ctx, name, params)
        return Ok()
    }

    stop() {
        this._unsub.forEach((u) => u())
        this._unsub = []

        this._schedules.forEach((s) => clearInterval(s))
        this._schedules = []
    }

    addEventListener(event: "start", cb: (args: { name: string }) => void): () => void
    addEventListener(event: "end", cb: (args: { name: string }) => void): () => void
    addEventListener(event: "error", cb: (args: { name: string; error: Error }) => void): () => void
    public addEventListener(
        event: "start" | "end" | "error",
        cb: ((args: { name: string }) => void) | ((args: { name: string; error: Error }) => void),
    ) {
        this._events[event].push(cb as any)

        return () => {
            this._events[event] = this._events[event].filter((i) => cb !== i) as any
        }
    }

    private _triggerEvent(event: "start" | "end", args: { name: keyof Jobs }): void
    private _triggerEvent(event: "error", args: { name: keyof Jobs; error: Error }): void
    private _triggerEvent(
        event: "start" | "end" | "error",
        args: { name: string } | { name: keyof Jobs; error: Error },
    ) {
        this._events[event].forEach((cb) => {
            queueTask(() => cb(args as never))
        })
    }

    private _runJob<Name extends keyof Jobs>(ctx: Context, name: Name): void
    private _runJob<Name extends keyof Jobs>(
        ctx: Context,
        name: Name,
        params: Parameters<Jobs[Name]["run"]>[1],
    ): void
    private _runJob<Name extends keyof Jobs>(
        ctx: Context,
        name: Name,
        params?: Parameters<Jobs[Name]["run"]>[1],
    ): void {
        let job = this._registeredJobs[name]
        if (job) {
            let [ctxWithCancel, cancel] = ctx.withCancel()
            this._triggerEvent("start", { name })
            job.run(ctxWithCancel, params as never)
                .then(([, err]) => {
                    if (err) {
                        this._triggerEvent("error", {
                            name,
                            error: err,
                        })
                    } else {
                        this._triggerEvent("end", {
                            name,
                        })
                    }
                })
                .catch((err) => {
                    this._triggerEvent("error", {
                        name,
                        error: err,
                    })
                })
                .finally(() => cancel())
        }
    }
}
