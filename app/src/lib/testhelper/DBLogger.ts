import { newID } from "@/domain/ID"
import { Lock } from "@/lib/Lock"
import type { Context } from "@/lib/context"
import type { DBExec, DBValue, Database } from "@/lib/database"
import { type AsyncResult, fromPromise } from "@/lib/result"

export class DBLogger implements Database {
    private _lock: Lock
    private _db: Database
    private _log: (event: string, args?: any) => void

    constructor(db: Database, log: (event: string, args?: any) => void) {
        this._db = db
        this._lock = new Lock(`dblogger_${newID()}}`)
        this._log = log
        // @ts-expect-error: this is for debugging
        globalThis.__CONVEYOR_DB__ = this
    }

    open(
        ctx: Context,
        params: {
            file: string
            enckey: string
            enableTracing: boolean
        },
    ): Promise<void> {
        this._log("open", params)
        return this._db.open(ctx, params)
    }

    close(): Promise<void> {
        this._log("close")
        return this._db.close()
    }

    exec(sql: string, args?: DBValue[], abort?: AbortSignal): Promise<number> {
        this._log("exec", [sql, args])
        return this._db.exec(sql, args, abort)
    }

    query<R extends Record<string, DBValue>>(
        sql: string,
        args?: DBValue[],
        abort?: AbortSignal,
    ): Promise<R[]> {
        this._log("query", [sql, args])
        return this._db.query(sql, args, abort)
    }

    queryOne<R extends Record<string, DBValue>>(
        sql: string,
        args?: DBValue[],
        abort?: AbortSignal,
    ): Promise<R | undefined> {
        this._log("queryOne", [sql, args])
        return this._db.queryOne(sql, args, abort)
    }

    inTransaction<R>(
        ctx: Context<{ db?: DBExec }>,
        fn: (ctx: Context<{ db: DBExec }>) => AsyncResult<R>,
    ): AsyncResult<R> {
        this._log("inTransaction")

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
