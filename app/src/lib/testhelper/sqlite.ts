import sqlite3InitModule, {
    type SqlValue,
    type InitOptions,
    type Database as SQliteDatabase,
    type Sqlite3Static,
} from "@sqlite.org/sqlite-wasm"

import type { DBExec, Database } from "@/lib/database"
import { migrate } from "@/storage/database/sqlite/migrator"

export class SQLite implements Database {
    private sqlite3: Promise<Sqlite3Static>
    private db: Promise<SQliteDatabase> = undefined as any
    private currentTransaction: Promise<void> = Promise.resolve()
    private lock = new Int32Array(new ArrayBuffer(4))

    constructor() {
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

    public async open() {
        this.db = (async () => {
            let sqlite3 = await this.sqlite3
            return new sqlite3.oo1.DB(":memory:")
        })()
        let db = await this.db
        db.exec({ sql: "PRAGMA foreign_keys = true;" })
        await migrate(this)
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

    public async inTransaction<R>(cb: (tx: DBExec) => Promise<R>): Promise<R> {
        let unlock = await this.aquireTransactionLock()
        try {
            await this.exec("BEGIN DEFERRED TRANSACTION")
            let r = await cb(this)
            await this.exec("COMMIT")

            unlock()

            return r
        } catch (e) {
            await this.exec("ROLLBACK TRANSACTION")

            unlock()

            throw e
        }
    }

    private async aquireTransactionLock(): Promise<() => void> {
        let locked = Atomics.compareExchange(this.lock, 0, 0, 1)
        if (locked !== 0) {
            await this.currentTransaction

            return this.aquireTransactionLock()
        }

        let currentTransaction = Promise.withResolvers<void>()
        this.currentTransaction = currentTransaction.promise

        return () => {
            Atomics.store(this.lock, 0, 0)
            currentTransaction.resolve()
        }
    }
}
