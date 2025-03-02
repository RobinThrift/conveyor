import type { Context } from "@/lib/context"
import { type AsyncResult, fromPromise } from "@/lib/result"

declare type DBValue =
    | string
    | number
    | boolean
    | null
    | bigint
    | Uint8Array
    | Int8Array
    | ArrayBuffer

export interface Database extends DBExec {
    open(
        ctx: Context,
        params: {
            file: string
            enckey: string
            enableTracing: boolean
        },
    ): Promise<void>

    close(): Promise<void>

    inTransaction<R>(cb: (tx: DBExec) => Promise<R>): Promise<R>
}

export interface DBExec {
    exec(sql: string, args?: DBValue[], abort?: AbortSignal): Promise<number>
    query<R extends Record<string, DBValue>>(
        sql: string,
        args?: DBValue[],
        abort?: AbortSignal,
    ): Promise<R[]>
    queryOne<R extends Record<string, DBValue>>(
        sql: string,
        args?: DBValue[],
        abort?: AbortSignal,
    ): Promise<R | undefined>
}

export function withTx<R>(
    ctx: Context<{ db?: DBExec }>,
    fallback: Database,
    fn: (ctx: Context<{ db: DBExec }>) => AsyncResult<R>,
): AsyncResult<R> {
    if ("db" in ctx.data && typeof ctx.data.db !== "undefined") {
        return fn(ctx.withData("db", ctx.data.db))
    }

    return fromPromise(
        fallback.inTransaction(async (tx) => {
            let res = await fn(ctx.withData("db", tx))
            if (!res.ok) {
                throw res.err
            }
            return res.value
        }),
    )
}
