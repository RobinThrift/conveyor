import sqlite3InitModule, {
    type Database,
    type InitOptions,
    type Sqlite3Static,
    type SqlValue,
} from "@sqlite.org/sqlite-wasm"

import type { Context } from "@/lib/context"
import { createErrType } from "@/lib/errors"
import { type AsyncResult, fromPromise, fromThrowing, Ok, wrapErr } from "@/lib/result"
import { createWorker } from "@/lib/worker"

import { privateKeyToDBKey } from "./privateKeyToDBKey"

let sqlite3: Sqlite3Static | undefined
let sqlite3Init: Promise<Sqlite3Static>
let db: Database | undefined

const ErrOpen = createErrType("SQLiteWorker", "error reading file")

export const SQLiteWorker = createWorker({
    _setup: async (_ctx: Context, _params: any): AsyncResult<void> => {
        sqlite3Init = (async () => {
            performance.mark("sqlite-worker:init:start")
            let s = await sqlite3InitModule({
                print: (msg) => console.log(msg),
                printErr: (err) => console.error(err),
                locateFile: () => {
                    return "/assets/sqlite3/sqlite3.wasm"
                },
                setStatus: (_: string) => {
                    // this NEEDs to be set, otherwise the initialization WILL fail
                },
            } as InitOptions)
            performance.mark("sqlite-worker:init:end")

            return s
        })()

        return Ok(undefined)
    },

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
        let [sqlite3InitValue, initErr] = await fromPromise(sqlite3Init)
        if (initErr) {
            return wrapErr`${ErrOpen}: ${initErr}`
        }

        sqlite3 = sqlite3InitValue

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
                sql: `PRAGMA key = "x'${privateKeyToDBKey(enckey)}'";`,
            })

            try {
                db.selectValue("PRAGMA user_version")
            } catch {
                db.exec({
                    sql: `PRAGMA key = '${enckey}'`,
                })
            }

            if (enableTracing) {
                db.exec([
                    "PRAGMA cipher_settings;",
                    "PRAGMA cipher_profile;",
                    "PRAGMA cipher_log_level =  DEBUG;",
                    "PRAGMA cipher_log = stdout;",
                ])
            }
        })
    },

    close: async (): AsyncResult<void> => {
        console.debug(`Closing SQLite3 database (version: ${sqlite3?.version.libVersion})`)

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
            let changed = db?.affirmOpen().exec({ sql, bind: args }).changes() ?? 0
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
