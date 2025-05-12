import sqlite3InitModule, {
    type SqlValue,
    type InitOptions,
    type Database,
    type Sqlite3Static,
} from "@sqlite.org/sqlite-wasm"

import type { Context } from "@/lib/context"
import { type AsyncResult, fromPromise, fromThrowing } from "@/lib/result"
import { createWorker } from "@/lib/worker"

let sqlite3: Sqlite3Static | undefined = undefined
let db: Database | undefined = undefined

export const SQLiteWorker = createWorker({
    open: async (
        _,
        {
            file,
            enckey,
            enableTracing,
        }: {
            file: string
            enckey: string
            enableTracing?: boolean
        },
    ): AsyncResult<void> => {
        let sqlite3InitRes = await fromPromise(
            sqlite3InitModule({
                print: (msg) => console.log(msg),
                printErr: (err) => console.error(err),
                locateFile: () => {
                    return "/assets/sqlite3/sqlite3.wasm"
                },
                setStatus: (_: string) => {
                    // this NEEDs to be set, otherwise the initialization WILL fail
                },
            } as InitOptions),
        )

        if (!sqlite3InitRes.ok) {
            return sqlite3InitRes
        }

        sqlite3 = sqlite3InitRes.value

        console.debug(
            `Opening SQLite3 database (file: ${file}; version: ${sqlite3.version.libVersion})`,
        )

        let flags = "c"
        if (enableTracing) {
            flags += "t"
        }

        return fromThrowing(() => {
            db =
                // biome-ignore lint/style/noNonNullAssertion: this must never be null
                "opfs" in sqlite3!
                    ? new sqlite3.oo1.OpfsDb(file, flags)
                    : // biome-ignore lint/style/noNonNullAssertion: this must never be null
                      new sqlite3!.oo1.DB(file, flags)

            console.debug(
                // biome-ignore lint/style/noNonNullAssertion: this must never be null
                "opfs" in sqlite3!
                    ? `OPFS is available, created persisted database at ${db.filename}`
                    : `OPFS is not available, created transient database ${db.filename}`,
            )

            db.exec({
                sql: `PRAGMA key = '${enckey}'`, // @TODO: add escpaing
            })

            if (enableTracing) {
                db.exec([
                    "PRAGMA cipher_settings;",
                    "PRAGMA cipher_log = stdout;",
                ])
            }
        })
    },

    close: async (): AsyncResult<void> => {
        console.debug(
            `Closing SQLite3 database (version: ${sqlite3?.version.libVersion})`,
        )

        return fromThrowing(() => {
            db?.affirmOpen().close()
            db = undefined
        })
    },

    exec: async (
        _,
        { sql, args }: { sql: string; args?: (SqlValue | boolean)[] },
    ): AsyncResult<number> => {
        return fromThrowing(() => {
            let changed =
                db?.affirmOpen().exec({ sql, bind: args }).changes() ?? 0
            return changed
        })
    },

    query: async <R extends Record<string, SqlValue | boolean>>(
        _: Context,
        { sql, args }: { sql: string; args?: (SqlValue | boolean)[] },
    ): AsyncResult<R[]> => {
        return fromThrowing(() => {
            let rows = db?.affirmOpen().selectObjects(sql, args)
            return rows as R[]
        })
    },

    queryOne: async <R extends Record<string, SqlValue | boolean>>(
        _: Context,
        { sql, args }: { sql: string; args?: (SqlValue | boolean)[] },
    ): AsyncResult<R | undefined> => {
        return fromThrowing(() => {
            let row = db?.affirmOpen().selectObject(sql, args)
            return row as R
        })
    },
})

SQLiteWorker.runIfWorker()
