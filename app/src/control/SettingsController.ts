import type { ChangelogEntry, SettingChangelogEntry } from "@/domain/Changelog"
import type { Settings } from "@/domain/Settings"
import type { Context } from "@/lib/context"
import type { DBExec, Transactioner } from "@/lib/database"
import { createErrType } from "@/lib/errors"
import type { KeyPaths, ValueAt } from "@/lib/getset"
import { queueTask } from "@/lib/microtask"
import { type AsyncResult, Ok, wrapErr } from "@/lib/result"

type OnSettingChangedHandler = <K extends KeyPaths<Settings>>(data: {
    setting: {
        key: K
        value: ValueAt<Settings, K>
    }
}) => void

export class SettingsController {
    private _transactioner: Transactioner
    private _repo: Repo
    private _changelog: Changelog

    private _events = {
        onSettingChanged: [] as OnSettingChangedHandler[],
    }

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

    public addEventListener(
        event: "onSettingChanged",
        cb: OnSettingChangedHandler,
    ): () => void {
        this._events[event].push(cb)
        return () => {
            this._events[event] = this._events[event].filter((i) => cb !== i)
        }
    }

    public static ErrLoadSettings = createErrType(
        "SettingsController",
        "error loading settings",
    )
    public async loadSettings(ctx: Context): AsyncResult<Settings> {
        let [settings, err] = await this._repo.loadSettings(ctx)
        if (err) {
            return wrapErr`${new SettingsController.ErrLoadSettings()}: ${err}`
        }
        return Ok(settings)
    }

    public static ErrUpdateSetting = createErrType(
        "SettingsController",
        "error updating setting",
    )
    async updateSetting<K extends KeyPaths<Settings>>(
        ctx: Context,
        setting: {
            key: K
            value: ValueAt<Settings, K>
        },
    ): AsyncResult<void> {
        return this._transactioner.inTransaction(ctx, async (ctx) => {
            let [_, err] = await this._repo.updateSetting(ctx, setting)
            if (err) {
                return wrapErr`${new SettingsController.ErrUpdateSetting()}: ${err}`
            }

            let [_created, entryCreationErr] =
                await this._changelog.createChangelogEntry(ctx, {
                    revision: 0,
                    targetType: "settings",
                    targetID: setting.key,
                    value: {
                        value: setting.value as any,
                    } satisfies SettingChangelogEntry["value"],
                    isSynced: false,
                    isApplied: true,
                })
            if (entryCreationErr) {
                return wrapErr`${new SettingsController.ErrUpdateSetting()}: error creating changlog entry: ${entryCreationErr}`
            }

            return Ok()
        })
    }

    public static ErrApplyChangelogEntries = createErrType(
        "SettingsController",
        "error applying changelog entries",
    )
    public async applyChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        entries: SettingChangelogEntry[],
    ): AsyncResult<void> {
        for (let entry of entries) {
            let [_, err] = await this._repo.updateSetting(ctx, {
                key: entry.targetID,
                value: entry.value.value,
            })
            if (err) {
                return wrapErr`${new SettingsController.ErrApplyChangelogEntries()}: ${err}`
            }

            this._triggerEvent("onSettingChanged", {
                setting: {
                    key: entry.targetID,
                    value: entry.value.value,
                },
            })
        }

        return Ok()
    }

    private _triggerEvent<K extends KeyPaths<Settings>>(
        event: "onSettingChanged",
        data: {
            setting: {
                key: K
                value: ValueAt<Settings, K>
            }
        },
    ): void {
        this._events[event].forEach((cb) => {
            queueTask(() => cb(data))
        })
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
