import { DEFAULT_SETTINGS, type Settings } from "@/domain/Settings"
import type { Context } from "@/lib/context"
import type { DBExec } from "@/lib/database"
import { type KeyPaths, type ValueAt, setPath } from "@/lib/getset"
import { type AsyncResult, fromPromise, mapResult } from "@/lib/result"

import * as queries from "./gen/settings_sql"

export class SettingsRepo {
    private _db: DBExec

    constructor(db: DBExec) {
        this._db = db
    }

    public async loadSettings(
        ctx: Context<{ db: DBExec }>,
    ): AsyncResult<Settings> {
        let settings = structuredClone(DEFAULT_SETTINGS)

        let result = await fromPromise(
            queries.listSettings(ctx.getData("db", this._db), ctx.signal),
        )

        return mapResult(result, (entries) => {
            for (let entry of entries) {
                settings = setPath(
                    settings,
                    entry.key as KeyPaths<Settings>,
                    entry.value,
                )
            }

            return settings
        })
    }

    public async updateSetting<K extends KeyPaths<Settings>>(
        ctx: Context<{ db: DBExec }>,
        args: { key: K; value: ValueAt<Settings, K> },
    ): AsyncResult<void> {
        return fromPromise(
            queries.saveSetting(ctx.getData("db", this._db), args, ctx.signal),
        )
    }
}
