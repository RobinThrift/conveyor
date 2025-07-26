import sqlite3InitModule, {
    type InitOptions,
    type Database as SQliteDatabase,
    type Sqlite3Static,
    type SqlValue,
} from "@sqlite.org/sqlite-wasm"

import { newID } from "@/domain/ID"
import type { Context } from "@/lib/context"
import type { Database, DBExec } from "@/lib/database"
import { Lock } from "@/lib/Lock"
import type { AsyncResult } from "@/lib/result"
import { Err, fromPromise, Ok } from "@/lib/result"
import { migrate } from "@/storage/database/sqlite/migrator"

export class SQLite implements Database {
    private sqlite3: Promise<Sqlite3Static>
    private db: Promise<SQliteDatabase> = undefined as any
    private _lock: Lock

    constructor() {
        this._lock = new Lock(`sqlite_${newID()}}`)

        this.sqlite3 = sqlite3InitModule({
            print: (msg) => console.log(msg),
            printErr: (err) => console.error(err),
            locateFile: () => {
                return import.meta.resolve("../../../build/sqlite3/sqlite3.wasm")
            },
            setStatus: (_: string) => {
                // this NEEDs to be set, otherwise the initialization WILL fail
            },
        } as InitOptions)
    }

    public async open(ctx: Context) {
        this.db = (async () => {
            let sqlite3 = await this.sqlite3
            return new sqlite3.oo1.DB(":memory:")
        })()
        let db = await this.db
        db.exec({ sql: "PRAGMA foreign_keys = true;" })
        await migrate(ctx, this)
    }

    public async close() {
        let db = await this.db
        db.close()
    }

    public async exec(
        sql: string,
        args?: (SqlValue | boolean)[],
        _?: AbortSignal,
    ): Promise<number> {
        let db = await this.db
        return db.exec({ sql, bind: args }).changes()
    }

    public async query<R extends Record<string, SqlValue | boolean>>(
        sql: string,
        args?: (SqlValue | boolean)[],
        _?: AbortSignal,
    ): Promise<R[]> {
        let db = await this.db

        let o = db.selectObjects(sql, args) as R[]

        return o
    }

    public async queryOne<R extends Record<string, SqlValue | boolean>>(
        sql: string,
        args?: (SqlValue | boolean)[],
        _?: AbortSignal,
    ): Promise<R | undefined> {
        let db = await this.db
        return db.selectObject(sql, args) as R
    }

    public async inTransaction<R>(
        ctx: Context<{ db?: DBExec }>,
        fn: (ctx: Context<{ db: DBExec }>) => AsyncResult<R>,
    ): AsyncResult<R> {
        let tx = ctx.getData("db")
        if (tx) {
            return fn(ctx.withData("db", tx))
        }

        return this._lock.run(ctx, async (ctx: Context) => {
            let [_begin, beginErr] = await fromPromise(this.exec("BEGIN DEFERRED TRANSACTION"))
            if (beginErr) {
                return Err(beginErr)
            }

            let [res, err] = await fn(ctx.withData("db", this))
            if (err) {
                await this.exec("ROLLBACK TRANSACTION")
                return Err(err)
            }

            let [_commit, commitErr] = await fromPromise(this.exec("COMMIT TRANSACTION"))
            if (commitErr) {
                return Err(commitErr)
            }

            return Ok(res)
        })
    }
}
