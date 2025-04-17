import type { Database, DBExec, DBValue } from "@/lib/database"
import type { Context } from "@/lib/context"
import type { AsyncResult } from "@/lib/result"

export class DBLogger implements Database {
    private _db: Database
    private _log: (event: string, args?: any) => void

    constructor(db: Database, log: (event: string, args?: any) => void) {
        this._db = db
        this._log = log
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

    inTransaction<R>(
        ctx: Context<{ db?: DBExec }>,
        fn: (ctx: Context<{ db: DBExec }>) => AsyncResult<R>,
    ): AsyncResult<R> {
        this._log("inTransaction")
        return this._db.inTransaction(ctx, fn)
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
}
