import type { SqlValue } from "@sqlite.org/sqlite-wasm"

import { BaseContext, type Context } from "@/lib/context"
import type { DBExec, Database } from "@/lib/database"
import { type AsyncResult, fromPromise, toPromise } from "@/lib/result"
import { migrate } from "@/storage/database/sqlite/migrator"

import { SQLiteWorker } from "./sqlite.worker"

export class SQLite implements Database {
    private _baseCtx: Context
    private _worker: ReturnType<typeof SQLiteWorker.createClient>
    private _currentTransaction: Promise<void> = Promise.resolve()
    private _ready: ReturnType<typeof Promise.withResolvers<void>>

    constructor({
        baseCtx,
        onError,
    }: { baseCtx?: Context; onError?: (err: Error) => void } = {}) {
        this._ready = Promise.withResolvers()
        this._baseCtx = baseCtx ?? BaseContext
        this._worker = SQLiteWorker.createClient(
            new Worker(new URL("./sqlite.worker?worker&url", import.meta.url), {
                type: "module",
                name: "SQLiteWorker",
            }),
        )

        if (onError) {
            this._worker.addEventListener("error", (evt) => {
                onError(evt.data.error)
            })
        }

        // this._worker.addEventListener("error", (evt) => {
        // let [title, message] = evt.data.error.message.split(/:\n/, 2)
        //     eventbus.emit("notifications:add", {
        //         type: "error",
        //         title: `SQLiteWorker: ${title}`,
        //         message,
        //     })
        // })
    }

    // public addEventListener(event: "error", cb: (n: Notification) => void) {
    //     this._worker.addEventListener(event, (evt) => {
    //         let [title, message] = evt.data.error.message.split(/:\n/, 2)
    //         cb({
    //             type: "error",
    //             title: `SQLiteWorker: ${title}`,
    //             message,
    //         })
    //     })
    // }

    public async open(
        ctx: Context,
        params: {
            file: string
            enckey: string
            enableTracing?: boolean
        },
    ) {
        await toPromise(this._worker.open(ctx, params))
        await toPromise(
            this._worker.exec(ctx, { sql: "PRAGMA foreign_keys = true;" }),
        )
        this._ready.resolve()
        await migrate(ctx, this)
    }

    public async close() {
        await this._worker.close()
        this._worker.terminate()
        this._worker = undefined as any
    }

    public async exec(
        sql: string,
        args?: (SqlValue | boolean)[],
        abort?: AbortSignal,
    ): Promise<number> {
        await this._ready.promise
        return toPromise(
            this._worker.exec(this._baseCtx.withSignal(abort), {
                sql,
                args,
            }),
        )
    }

    public async query<R extends Record<string, SqlValue | boolean>>(
        sql: string,
        args?: (SqlValue | boolean)[],
        abort?: AbortSignal,
    ): Promise<R[]> {
        await this._ready.promise
        return toPromise(
            this._worker.query<R>(this._baseCtx.withSignal(abort), {
                sql,
                args,
            }),
        )
    }

    public async queryOne<R extends Record<string, SqlValue | boolean>>(
        sql: string,
        args?: (SqlValue | boolean)[],
        abort?: AbortSignal,
    ): Promise<R | undefined> {
        await this._ready.promise
        return toPromise(
            this._worker.queryOne<R>(this._baseCtx.withSignal(abort), {
                sql,
                args,
            }),
        )
    }

    public async inTransaction<R>(
        ctx: Context<{ db?: DBExec }>,
        fn: (ctx: Context<{ db: DBExec }>) => AsyncResult<R>,
    ): AsyncResult<R> {
        await this._ready.promise

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

        let begin = await fromPromise(this.exec("BEGIN TRANSACTION"))
        if (!begin.ok) {
            transaction.resolve()
            return begin
        }

        let res = await fn(ctx.withData("db", new Transaction(this)))
        if (!res.ok) {
            transaction.resolve()
            await this.exec("ROLLBACK TRANSACTION")
            return res
        }

        let commit = await fromPromise(this.exec("COMMIT"))
        if (!commit.ok) {
            transaction.resolve()
            return commit
        }

        transaction.resolve()
        return res
    }
}

class Transaction {
    private db: DBExec
    constructor(db: DBExec) {
        this.db = db
    }

    exec(sql: string, args?: (SqlValue | boolean)[]): Promise<number> {
        return this.db.exec(sql, args)
    }

    query<R extends Record<string, SqlValue | boolean>>(
        sql: string,
        args?: (SqlValue | boolean)[],
    ): Promise<R[]> {
        return this.db.query(sql, args)
    }

    queryOne<R extends Record<string, SqlValue | boolean>>(
        sql: string,
        args?: (SqlValue | boolean)[],
    ): Promise<R | undefined> {
        return this.db.queryOne(sql, args)
    }
}
