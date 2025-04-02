import sqlite3InitModule, {
    type SqlValue,
    type InitOptions,
    type Database as SQliteDatabase,
    type Sqlite3Static,
} from "@sqlite.org/sqlite-wasm"

import type { Context } from "@/lib/context"
import type { DBExec, Database } from "@/lib/database"
import type { AsyncResult } from "@/lib/result"
import { migrate } from "@/storage/database/sqlite/migrator"
import { fromPromise } from "@/lib/result"
import { Lock } from "@/lib/Lock"
import { newID } from "@/domain/ID"

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
                return import.meta.resolve(
                    "../../../build/sqlite3/sqlite3.wasm",
                )
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
