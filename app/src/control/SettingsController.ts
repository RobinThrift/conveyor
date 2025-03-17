import type { ChangelogEntry, SettingChangelogEntry } from "@/domain/Changelog"
import type { Settings } from "@/domain/Settings"
import type { Context } from "@/lib/context"
import type { DBExec, Transactioner } from "@/lib/database"
import type { KeyPaths, ValueAt } from "@/lib/getset"
import { type AsyncResult, Ok } from "@/lib/result"

export class SettingsController {
    private _transactioner: Transactioner
    private _repo: Repo
    private _changelog: Changelog

    constructor({
        transactioner,
        repo,
        changelog,
    }: {
        transactioner: Transactioner
        repo: Repo
        changelog: Changelog
    }) {
        this._transactioner = transactioner
        this._repo = repo
        this._changelog = changelog
    }

    public async loadSettings(ctx: Context): AsyncResult<Settings> {
        return this._repo.loadSettings(ctx)
    }

    async updateSetting<K extends KeyPaths<Settings>>(
        ctx: Context,
        setting: {
            key: K
            value: ValueAt<Settings, K>
        },
    ): AsyncResult<void> {
        return this._transactioner.inTransaction(ctx, async (ctx) => {
            let res = await this._repo.updateSetting(ctx, setting)
            if (!res.ok) {
                return res
            }

            let entryCreated = await this._changelog.createChangelogEntry(ctx, {
                revision: 0,
                targetType: "settings",
                targetID: setting.key,
                value: {
                    value: setting.value as any,
                } satisfies SettingChangelogEntry["value"],
                isSynced: false,
                isApplied: true,
            })
            if (!entryCreated.ok) {
                return entryCreated
            }

            return res
        })
    }

    public async applyChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        entries: SettingChangelogEntry[],
    ): AsyncResult<void> {
        for (let entry of entries) {
            let applied = await this._repo.updateSetting(ctx, {
                key: entry.targetID,
                value: entry.value.value,
            })
            if (!applied.ok) {
                return applied
            }
        }

        return Ok(undefined)
    }
}

export interface Repo {
    loadSettings(ctx: Context<{ db?: DBExec }>): AsyncResult<Settings>

    updateSetting<K extends KeyPaths<Settings>>(
        ctx: Context<{ db?: DBExec }>,
        args: { key: K; value: ValueAt<Settings, K> },
    ): AsyncResult<void>
}

export interface Changelog {
    createChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        entry: Omit<ChangelogEntry, "source" | "id" | "timestamp">,
    ): AsyncResult<void>
}
