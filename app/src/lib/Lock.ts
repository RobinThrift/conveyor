import type { Context } from "@/lib/context"
import { type AsyncResult, Err, Ok, type Result } from "@/lib/result"

export class Lock {
    public name: string
    constructor(name: string) {
        this.name = name
    }

    public async run<T>(
        ctx: Context,
        fn: (ctx: Context) => AsyncResult<T>,
    ): AsyncResult<T> {
        return this._run(ctx, {}, fn)
    }

    public async runIfAvailable<T>(
        ctx: Context,
        fn: (ctx: Context) => AsyncResult<T | undefined>,
    ): AsyncResult<T | undefined> {
        return this._run(ctx, { ifAvailable: true }, fn)
    }

    private async _run<T>(
        ctx: Context,
        opts: { ifAvailable?: boolean },
        fn: (ctx: Context) => AsyncResult<T>,
    ): AsyncResult<T> {
        let [ctxWithCancel, cancel] = ctx.withCancel()

        let res: Result<T>
        try {
            res = await navigator.locks.request(
                this.name,
                {
                    mode: "exclusive",
                    ifAvailable: opts.ifAvailable,
                    signal: opts.ifAvailable ? undefined : ctxWithCancel.signal,
                },
                async (lock) => {
                    if (!lock) {
                        return Ok(undefined as T)
                    }
                    if (ctxWithCancel.isCancelled()) {
                        return Err(ctx.err() as Error)
                    }
                    return fn(ctxWithCancel)
                },
            )
        } catch (err) {
            return Err(err as Error)
        }

        if (ctxWithCancel.isCancelled()) {
            return Err(ctx.err() as Error)
        }

        cancel()

        return res
    }
}
