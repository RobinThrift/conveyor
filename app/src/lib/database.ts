import type { Context } from "@/lib/context"
import type { AsyncResult } from "@/lib/result"

export type DBValue =
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

    inTransaction<R>(
        ctx: Context<{ db?: DBExec }>,
        fn: (ctx: Context<{ db: DBExec }>) => AsyncResult<R>,
    ): AsyncResult<R>
}

export interface Transactioner {
    inTransaction<R>(
        ctx: Context<{ db?: DBExec }>,
        fn: (ctx: Context<{ db: DBExec }>) => AsyncResult<R>,
    ): AsyncResult<R>
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
