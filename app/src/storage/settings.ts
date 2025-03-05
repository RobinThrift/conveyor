import type { ChangelogEntry, SettingChangelogEntry } from "@/domain/Changelog"
import type { Settings } from "@/domain/Settings"
import type { Context } from "@/lib/context"
import type { DBExec, Database } from "@/lib/database"
import type { KeyPaths, ValueAt } from "@/lib/getset"
import type { AsyncResult } from "@/lib/result"

export class SettingsStorage {
    private _repo: SettingsRepo
    private _db: Database
    private _changelog: SettingsStorageChangelog

    constructor({
        db,
        repo,
        changelog,
    }: {
        db: Database
        repo: SettingsRepo
        changelog: SettingsStorageChangelog
    }) {
        this._db = db
        this._repo = repo
        this._changelog = changelog
    }

    public async loadSettings(ctx: Context): AsyncResult<Settings> {
        return this._repo.loadSettings(ctx.withData("db", this._db))
    }

    async updateSetting<K extends KeyPaths<Settings>>(
        ctx: Context,
        setting: {
            key: K
            value: ValueAt<Settings, K>
        },
    ): AsyncResult<void> {
        return this._db.inTransaction(async (tx) => {
            let res = await this._repo.updateSetting(
                ctx.withData("db", tx),
                setting,
            )
            if (!res.ok) {
                return res
            }

            let entryCreated = await this._changelog.createChangelogEntry(
                ctx.withData("db", tx),
                {
                    revision: 0,
                    targetType: "settings",
                    targetID: setting.key,
                    value: {
                        value: setting.value as any,
                    } satisfies SettingChangelogEntry["value"],
                    isSynced: false,
                    isApplied: true,
                },
            )
            if (!entryCreated.ok) {
                return entryCreated
            }

            return res
        })
    }

    public async applyChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        entry: SettingChangelogEntry,
    ): AsyncResult<void> {
        return this._repo.updateSetting(ctx.withData("db", this._db), {
            key: entry.targetID,
            value: entry.value.value,
        })
    }
}

export interface SettingsRepo {
    loadSettings(ctx: Context<{ db: DBExec }>): AsyncResult<Settings>

    updateSetting<K extends KeyPaths<Settings>>(
        ctx: Context<{ db: DBExec }>,
        args: { key: K; value: ValueAt<Settings, K> },
    ): AsyncResult<void>
}

export interface SettingsStorageChangelog {
    createChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        entry: Omit<ChangelogEntry, "source" | "id" | "timestamp">,
    ): AsyncResult<void>
}
