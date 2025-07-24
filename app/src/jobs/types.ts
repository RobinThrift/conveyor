import type { Context } from "@/lib/context"
import type { AsyncResult } from "@/lib/result"

export interface Job {
    run(ctx: Context): AsyncResult<void>
}

export interface JobWithParams<Params = never> {
    run(ctx: Context, params: Params): AsyncResult<void>
}
