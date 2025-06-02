import type { SqlValue } from "@sqlite.org/sqlite-wasm"

import { newID } from "@/domain/ID"
import { Lock } from "@/lib/Lock"
import { BaseContext, type Context } from "@/lib/context"
import type { DBExec, Database } from "@/lib/database"
import { type AsyncResult, Err, Ok, fromPromise, toPromise } from "@/lib/result"
import {
    migrate,
    migrateDBEncryption,
} from "@/storage/database/sqlite/migrator"

import { SQLiteWorker } from "./SQLiteWorker"

export class SQLite implements Database {
    private _baseCtx: Context
    private _worker: ReturnType<typeof SQLiteWorker.createClient>
    private _lock: Lock
    private _ready: ReturnType<typeof Promise.withResolvers<void>>

    constructor({
        baseCtx,
        onError,
    }: { baseCtx?: Context; onError?: (err: Error) => void } = {}) {
        this._lock = new Lock(`sqlite_${newID()}}`)
        this._ready = Promise.withResolvers()
        this._baseCtx = baseCtx ?? BaseContext
        this._worker = SQLiteWorker.createClient(
            new Worker(new URL("./sqlite.worker?worker&url", import.meta.url), {
                type: "module",
                name: `SQLiteWorker-${newID()}`,
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
        performance.mark("sql:open:start", { detail: { args: [params] } })
        await toPromise(this._worker.open(ctx, params))
        await toPromise(
            this._worker.exec(ctx, { sql: "PRAGMA foreign_keys = true;" }),
        )
        this._ready.resolve()
        performance.mark("sql:open:end")
        await migrate(ctx, this)

        await migrateDBEncryption(ctx, { db: this, enckey: params.enckey })
    }

    public async close() {
        performance.mark("sql:close:start")
        await this._worker.close()
        performance.mark("sql:close:end")
    }

    public async exec(
        sql: string,
        args?: (SqlValue | boolean)[],
        abort?: AbortSignal,
    ): Promise<number> {
        performance.mark("sql:exec:start", { detail: { sql, args } })
        await this._ready.promise
        let res = await toPromise(
            this._worker.exec(this._baseCtx.withSignal(abort), {
                sql,
                args,
            }),
        )
        performance.mark("sql:exec:end")
        return res
    }

    public async query<R extends Record<string, SqlValue | boolean>>(
        sql: string,
        args?: (SqlValue | boolean)[],
        abort?: AbortSignal,
    ): Promise<R[]> {
        performance.mark("sql:query:start", { detail: { sql, args } })
        await this._ready.promise
        let res = await toPromise(
            this._worker.query<R>(this._baseCtx.withSignal(abort), {
                sql,
                args,
            }),
        )
        performance.mark("sql:query:end")
        return res
    }

    public async queryOne<R extends Record<string, SqlValue | boolean>>(
        sql: string,
        args?: (SqlValue | boolean)[],
        abort?: AbortSignal,
    ): Promise<R | undefined> {
        performance.mark("sql:query-one:start", { detail: { sql, args } })
        await this._ready.promise
        let res = await toPromise(
            this._worker.queryOne<R>(this._baseCtx.withSignal(abort), {
                sql,
                args,
            }),
        )
        performance.mark("sql:query-one:end")
        return res
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

        return this._lock.run(ctx, async (ctx: Context) => {
            let [_begin, beginErr] = await fromPromise(
                this.exec("BEGIN DEFERRED TRANSACTION"),
            )
            if (beginErr) {
                return Err(beginErr)
            }

            let [res, err] = await fn(ctx.withData("db", new Transaction(this)))
            if (err) {
                await this.exec("ROLLBACK TRANSACTION")
                return Err(err)
            }

            let [_commit, commitErr] = await fromPromise(
                this.exec("COMMIT TRANSACTION"),
            )
            if (commitErr) {
                return Err(commitErr)
            }

            return Ok(res)
        })
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
