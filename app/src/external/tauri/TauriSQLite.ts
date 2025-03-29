import type { SqlValue } from "@sqlite.org/sqlite-wasm"
import { invoke } from "@tauri-apps/api/core"

import type { Context } from "@/lib/context"
import type { DBExec, Database } from "@/lib/database"
import { type AsyncResult, fromPromise } from "@/lib/result"
import { migrate } from "@/storage/database/sqlite/migrator"

export class TauriSQLite implements Database {
    private _handle = ""
    private _ready: ReturnType<typeof Promise.withResolvers<void>>
    private _currentTransaction: Promise<void> = Promise.resolve()

    constructor() {
        this._ready = Promise.withResolvers()
    }

    public async open(
        ctx: Context,
        params: {
            file: string
            enckey: string
            enableTracing?: boolean
        },
    ) {
        try {
            this._handle = await invoke<string>("plugin:sqlite|open", {
                db: params.file,
                options: {
                    journal_mode: "WAL",
                    foreign_keys: true,
                    busy_timeout: 5000,
                    pragmas: {
                        key: `'${params.enckey}'`,
                    },
                },
            })

            this._ready.resolve()

            await migrate(ctx, this)
        } catch (err) {
            if (err instanceof Error) {
                this._ready.reject(err)
                throw err
            }
            let e = new Error(err as string)
            this._ready.reject(e)
            throw e
        }
    }

    public async close() {
        let success = await invoke<boolean>("plugin:sqlite|close", {
            db: this._handle,
        })
        if (!success) {
            throw new Error("error closing database")
        }
    }

    public async exec(
        sql: string,
        args?: (SqlValue | boolean)[],
        abort?: AbortSignal,
    ): Promise<number> {
        await awaitWithAbort(this._ready.promise, abort)

        let [rowsAffected] = await awaitWithAbort(
            invoke<[number, number]>("plugin:sqlite|exec", {
                db: this._handle,
                sql,
                values: args ?? [],
            }),
            abort,
        )

        return rowsAffected
    }

    public async query<R extends Record<string, SqlValue | boolean>>(
        sql: string,
        args?: (SqlValue | boolean)[],
        abort?: AbortSignal,
    ): Promise<R[]> {
        await awaitWithAbort(this._ready.promise, abort)

        let rows = await awaitWithAbort(
            invoke<R[]>("plugin:sqlite|query", {
                db: this._handle,
                sql,
                values: args ?? [],
            }),
            abort,
        )

        return rows
    }

    public async queryOne<R extends Record<string, SqlValue | boolean>>(
        sql: string,
        args?: (SqlValue | boolean)[],
        abort?: AbortSignal,
    ): Promise<R | undefined> {
        await awaitWithAbort(this._ready.promise, abort)

        let rows = await awaitWithAbort(
            invoke<R[]>("plugin:sqlite|query", {
                db: this._handle,
                sql,
                values: args ?? [],
            }),
            abort,
        )

        if (!rows || !rows[0]) {
            return
        }
        return rows[0]
    }

    private async _begin(ctx: Context, abort?: AbortSignal) {
        await awaitWithAbort(this._ready.promise, ctx.signal)
        return awaitWithAbort(
            invoke("plugin:sqlite|tx_begin", {
                db: this._handle,
            }),
            abort,
        )
    }

    private async _commit(ctx: Context, abort?: AbortSignal) {
        await awaitWithAbort(this._ready.promise, ctx.signal)
        return awaitWithAbort(
            invoke("plugin:sqlite|tx_commit", {
                db: this._handle,
            }),
            abort,
        )
    }

    private async _rollback(ctx: Context, abort?: AbortSignal) {
        await awaitWithAbort(this._ready.promise, ctx.signal)
        return awaitWithAbort(
            invoke("plugin:sqlite|tx_rollback", {
                db: this._handle,
            }),
            abort,
        )
    }

    public async inTransaction<R>(
        ctx: Context<{ db?: DBExec }>,
        fn: (ctx: Context<{ db: DBExec }>) => AsyncResult<R>,
    ): AsyncResult<R> {
        await awaitWithAbort(this._ready.promise, ctx.signal)

        let tx = ctx.getData("db")
        if (tx) {
            return fn(ctx.withData("db", tx))
        }

        let transaction = Promise.withResolvers<void>()

        try {
            await this._currentTransaction
        } catch {
            // ignore errors
        }
        this._currentTransaction = transaction.promise

        let begin = await fromPromise(this._begin(ctx))
        if (!begin.ok) {
            transaction.resolve()
            return begin
        }

        let res = await fn(ctx.withData("db", new Transaction(this._handle)))
        if (!res.ok) {
            transaction.resolve()
            await this._rollback(ctx)
            return res
        }

        let commit = await fromPromise(this._commit(ctx))
        if (!commit.ok) {
            transaction.resolve()
            return commit
        }

        transaction.resolve()
        return res
    }
}

class Transaction {
    private _handle: string

    constructor(handle: string) {
        this._handle = handle
    }

    async exec(
        sql: string,
        args?: (SqlValue | boolean)[],
        abort?: AbortSignal,
    ): Promise<number> {
        let [rowsAffected] = await awaitWithAbort(
            invoke<[number, number]>("plugin:sqlite|tx_exec", {
                db: this._handle,
                sql,
                values: args ?? [],
            }),
            abort,
        )

        return rowsAffected
    }

    async query<R extends Record<string, SqlValue | boolean>>(
        sql: string,
        args?: (SqlValue | boolean)[],
        abort?: AbortSignal,
    ): Promise<R[]> {
        let rows = await awaitWithAbort(
            invoke<R[]>("plugin:sqlite|tx_query", {
                db: this._handle,
                sql,
                values: args ?? [],
            }),
            abort,
        )

        return rows
    }

    async queryOne<R extends Record<string, SqlValue | boolean>>(
        sql: string,
        args?: (SqlValue | boolean)[],
        abort?: AbortSignal,
    ): Promise<R | undefined> {
        let rows = await awaitWithAbort(
            invoke<R[]>("plugin:sqlite|tx_query", {
                db: this._handle,
                sql,
                values: args ?? [],
            }),
            abort,
        )

        if (!rows || !rows[0]) {
            return
        }

        return rows[0]
    }
}

function awaitWithAbort<R>(
    other: Promise<R>,
    signal?: AbortSignal,
): Promise<R> {
    if (!signal) {
        return other
    }

    return Promise.race([
        other,
        new Promise<R>((_, reject) => {
            signal.addEventListener("abort", reject, { once: true })
        }),
    ])
}
