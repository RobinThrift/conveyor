import {
    assert,
    afterAll,
    beforeAll,
    onTestFinished,
    suite,
    test,
} from "vitest"

import type { SettingChangelogEntry } from "@/domain/Changelog"
import { DEFAULT_SETTINGS } from "@/domain/Settings"
import { BaseContext } from "@/lib/context"
import { assertOkResult } from "@/lib/testhelper/assertions"
import { SQLite } from "@/lib/testhelper/sqlite"

import { ChangelogStorage } from "./changelog"
import * as changelogRepo from "./database/sqlite/changelogRepo"
import * as settingRepo from "./database/sqlite/settingsRepo"
import { SettingsStorage } from "./settings"

suite.sequential("storage/settings", () => {
    let [ctx, cancel] = BaseContext.withData("db", undefined).withCancel()
    let db = new SQLite()
    let settingsStorage = new SettingsStorage({
        db,
        repo: settingRepo,
        changelog: new ChangelogStorage({
            sourceName: "tests",
            db,
            repo: changelogRepo,
        }),
    })

    beforeAll(async () => {
        await db.open()
    })

    afterAll(async () => {
        cancel()
        await db.close()
    })

    test("loadSettings (defaults)", async () => {
        let expected = DEFAULT_SETTINGS
        let actual = await assertOkResult(settingsStorage.loadSettings(ctx))
        assert.deepEqual(actual, expected)
    })

    test("updateSetting", async () => {
        let initial = await assertOkResult(settingsStorage.loadSettings(ctx))
        await assertOkResult(
            settingsStorage.updateSetting(ctx, {
                key: "locale.language",
                value: "de",
            }),
        )

        let updated = await assertOkResult(settingsStorage.loadSettings(ctx))

        assert.notDeepEqual(initial, updated)
    })
})

test("storage/settings/changelog", async () => {
    let [ctx, cancel] = BaseContext.withData("db", undefined).withCancel()
    let db = new SQLite()
    let changelog = new ChangelogStorage({
        sourceName: "tests",
        db,
        repo: changelogRepo,
    })
    let settingsStorage = new SettingsStorage({
        db,
        repo: settingRepo,
        changelog,
    })

    await db.open()

    onTestFinished(async () => {
        cancel()
        await db.close()
    })

    await assertOkResult(
        settingsStorage.updateSetting(ctx, {
            key: "locale.language",
            value: "de",
        }),
    )

    await assertOkResult(
        settingsStorage.updateSetting(ctx, {
            key: "controls.vim",
            value: true,
        }),
    )

    await assertOkResult(
        settingsStorage.updateSetting(ctx, {
            key: "locale.language",
            value: "en",
        }),
    )

    let changes = await assertOkResult(
        changelog.listUnsyncedChangelogEntries(ctx, {
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
    assert.isFalse(entry.synced)
    assert.isTrue(entry.applied)

    entry = changes.items[1] as SettingChangelogEntry
    assert.equal(entry.source, "tests")
    assert.equal(entry.revision, 1)
    assert.equal(entry.targetType, "settings")
    assert.equal(entry.targetID, "controls.vim")
    assert.deepEqual(entry.value, { value: true })
    assert.isFalse(entry.synced)
    assert.isTrue(entry.applied)

    entry = changes.items[2] as SettingChangelogEntry
    assert.equal(entry.source, "tests")
    assert.equal(entry.revision, 2)
    assert.equal(entry.targetType, "settings")
    assert.equal(entry.targetID, "locale.language")
    assert.deepEqual(entry.value, { value: "en" })
    assert.isFalse(entry.synced)
    assert.isTrue(entry.applied)
})
