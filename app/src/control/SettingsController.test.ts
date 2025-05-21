import { assert, suite, test } from "vitest"

import type { SettingChangelogEntry } from "@/domain/Changelog"
import { newID } from "@/domain/ID"
import { DEFAULT_SETTINGS } from "@/domain/Settings"
import { BaseContext } from "@/lib/context"
import { assertOkResult } from "@/lib/testhelper/assertions"
import { SQLite } from "@/lib/testhelper/sqlite"
import { ChangelogRepo } from "@/storage/database/sqlite/ChangelogRepo"
import { SettingsRepo } from "@/storage/database/sqlite/SettingsRepo"

import { ChangelogController } from "./ChangelogController"
import { SettingsController } from "./SettingsController"

suite("control/SettingsController", async () => {
    test("loadSettings (defaults)", async ({ onTestFinished }) => {
        let { settingsCtrl, ctx, setup, cleanup } =
            await settingsCtrlTestSetup()

        await setup()
        onTestFinished(cleanup)

        let expected = DEFAULT_SETTINGS
        let actual = await assertOkResult(settingsCtrl.loadSettings(ctx))
        assert.deepEqual(actual, expected)
    })

    test("updateSetting", async ({ onTestFinished }) => {
        let { settingsCtrl, ctx, setup, cleanup } =
            await settingsCtrlTestSetup()

        await setup()
        onTestFinished(cleanup)

        let initial = await assertOkResult(settingsCtrl.loadSettings(ctx))
        await assertOkResult(
            settingsCtrl.updateSetting(ctx, {
                key: "locale.language",
                value: "de",
            }),
        )

        let updated = await assertOkResult(settingsCtrl.loadSettings(ctx))

        assert.notDeepEqual(initial, updated)
    })

    test("changelog", async ({ onTestFinished }) => {
        let { settingsCtrl, changelogCtrl, ctx, setup, cleanup } =
            await settingsCtrlTestSetup()

        await setup()
        onTestFinished(cleanup)

        await assertOkResult(
            settingsCtrl.updateSetting(ctx, {
                key: "locale.language",
                value: "de",
            }),
        )

        await assertOkResult(
            settingsCtrl.updateSetting(ctx, {
                key: "controls.vim",
                value: true,
            }),
        )

        await assertOkResult(
            settingsCtrl.updateSetting(ctx, {
                key: "locale.language",
                value: "en",
            }),
        )

        let changes = await assertOkResult(
            changelogCtrl.listUnsyncedChangelogEntries(ctx, {
                pagination: { pageSize: 100 },
            }),
        )

        assert.equal(changes.items.length, 3)

        let entry = changes.items[0] as SettingChangelogEntry
        assert.equal(entry.source, "tests")
        assert.equal(entry.revision, 1)
        assert.equal(entry.targetType, "settings")
        assert.equal(entry.targetID, "locale.language")
        assert.deepEqual(entry.value, { value: "de" })
        assert.isFalse(entry.isSynced)
        assert.isTrue(entry.isApplied)

        entry = changes.items[1] as SettingChangelogEntry
        assert.equal(entry.source, "tests")
        assert.equal(entry.revision, 1)
        assert.equal(entry.targetType, "settings")
        assert.equal(entry.targetID, "controls.vim")
        assert.deepEqual(entry.value, { value: true })
        assert.isFalse(entry.isSynced)
        assert.isTrue(entry.isApplied)

        entry = changes.items[2] as SettingChangelogEntry
        assert.equal(entry.source, "tests")
        assert.equal(entry.revision, 2)
        assert.equal(entry.targetType, "settings")
        assert.equal(entry.targetID, "locale.language")
        assert.deepEqual(entry.value, { value: "en" })
        assert.isFalse(entry.isSynced)
        assert.isTrue(entry.isApplied)
    })

    test("applyChangelogEntries", async ({ onTestFinished }) => {
        let { settingsCtrl, ctx, setup, cleanup } =
            await settingsCtrlTestSetup()

        await setup()
        onTestFinished(cleanup)

        await assertOkResult(
            settingsCtrl.applyChangelogEntries(ctx, [
                {
                    id: newID(),
                    source: "tests",
                    revision: 1,
                    targetType: "settings",
                    targetID: "locale.language",
                    isSynced: false,
                    isApplied: false,
                    timestamp: new Date(),
                    value: {
                        value: "de",
                    },
                },
            ]),
        )

        let updated = await assertOkResult(settingsCtrl.loadSettings(ctx))

        assert.equal(updated.locale.language, "de")
    })
})

async function settingsCtrlTestSetup() {
    let [ctx, cancel] = BaseContext.withCancel()

    let db = new SQLite()

    let changelogCtrl = new ChangelogController({
        sourceName: "tests",
        transactioner: db,
        repo: new ChangelogRepo(db),
    })

    let settingsCtrl = new SettingsController({
        transactioner: db,
        repo: new SettingsRepo(db),
        changelog: changelogCtrl,
    })

    return {
        settingsCtrl,
        changelogCtrl,
        ctx,
        setup: () => db.open(ctx),
        cleanup: async () => {
            cancel()
            await db.close()
        },
    }
}
