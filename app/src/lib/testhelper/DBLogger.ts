import { newID } from "@/domain/ID"
import { Lock } from "@/lib/Lock"
import type { Context } from "@/lib/context"
import type { DBExec, DBValue, Database } from "@/lib/database"
import { type AsyncResult, fromPromise } from "@/lib/result"

export class DBLogger implements Database {
    private _lock: Lock
    private _db: Database

    constructor(db: Database) {
        this._db = db
        this._lock = new Lock(`dblogger_${newID()}}`)
    }

    async open(
        ctx: Context,
        params: {
            file: string
            enckey: string
            enableTracing: boolean
        },
    ): Promise<void> {
        performance.mark("sql:open:start", { detail: { args: [params] } })
        let res = await this._db.open(ctx, params)
        performance.mark("sql:open:end")
        return res
    }

    async close(): Promise<void> {
        performance.mark("sql:clsoe:start")
        let res = await this._db.close()
        performance.mark("sql:close:end")
        return res
    }

    async exec(
        sql: string,
        args?: DBValue[],
        abort?: AbortSignal,
    ): Promise<number> {
        performance.mark("sql:exec:start", { detail: { sql, args } })
        let res = await this._db.exec(sql, args, abort)
        performance.mark("sql:exec:end")
        return res
    }

    async query<R extends Record<string, DBValue>>(
        sql: string,
        args?: DBValue[],
        abort?: AbortSignal,
    ): Promise<R[]> {
        performance.mark("sql:query:start", { detail: { sql, args } })
        let res = await this._db.query<R>(sql, args, abort)
        performance.mark("sql:query:end")
        return res
    }

    async queryOne<R extends Record<string, DBValue>>(
        sql: string,
        args?: DBValue[],
        abort?: AbortSignal,
    ): Promise<R | undefined> {
        performance.mark("sql:query-one:start", { detail: { sql, args } })
        let res = await this._db.queryOne<R>(sql, args, abort)
        performance.mark("sql:query-one:end")
        return res
    }

    inTransaction<R>(
        ctx: Context<{ db?: DBExec }>,
        fn: (ctx: Context<{ db: DBExec }>) => AsyncResult<R>,
    ): AsyncResult<R> {
        let tx = ctx.getData("db")
        if (tx) {
            return fn(ctx.withData("db", tx))
        }

        return this._lock.run(ctx, async (ctx: Context) => {
            let begin = await fromPromise(
                this.exec("BEGIN DEFERRED TRANSACTION"),
            )
            if (!begin.ok) {
                return begin
            }

            let res = await fn(ctx.withData("db", this))
            if (!res.ok) {
                await this.exec("ROLLBACK TRANSACTION")
                return res
            }

            let commit = await fromPromise(this.exec("COMMIT TRANSACTION"))
            if (!commit.ok) {
                return commit
            }

            return res
        })
    }
}
