import { assert, suite, test } from "vitest"

import type {
    ChangelogEntry,
    EncryptedChangelogEntry,
    SettingChangelogEntry,
} from "@/domain/Changelog"
import { newID } from "@/domain/ID"
import { AgeCrypto } from "@/external/age/AgeCrypto"
import { WebCryptoSha256Hasher } from "@/external/browser/crypto/WebCryptoSha256Hasher"
import { dataFromBase64, encodeToBase64 } from "@/lib/base64"
import { BaseContext, type Context } from "@/lib/context"
import type { Decrypter, Encrypter } from "@/lib/crypto"
import { parseJSON, parseJSONDate } from "@/lib/json"
import { type AsyncResult, Err, Ok, fmtErr, toPromise } from "@/lib/result"
import { TestInMemSyncStorage } from "@/lib/testhelper/TestInMemSyncStorage"
import { assertOkResult } from "@/lib/testhelper/assertions"
import { MockFS } from "@/lib/testhelper/mockfs"
import { SQLite } from "@/lib/testhelper/sqlite"
import { decodeText, encodeText } from "@/lib/textencoding"
import { AttachmentRepo } from "@/storage/database/sqlite/AttachmentRepo"
import { ChangelogRepo } from "@/storage/database/sqlite/ChangelogRepo"
import { MemoRepo } from "@/storage/database/sqlite/MemoRepo"
import { SettingsRepo } from "@/storage/database/sqlite/SettingsRepo"
import { addMinutes, roundToNearestMinutes } from "date-fns"

import { AttachmentController } from "./AttachmentController"
import { ChangelogController } from "./ChangelogController"
import { MemoController } from "./MemoController"
import { SettingsController } from "./SettingsController"
import { SyncController } from "./SyncController"

suite.concurrent("control/SyncController", async () => {
    test("fetchFullDB", async ({ onTestFinished }) => {
        let dbPath = "syncCtrl_fetchFullDB_test.db"
        let content = "THIS IS TOTALLY A DATABASE"

        let { ctx, setup, cleanup, syncCtrl, crypto, fs } =
            await setupSyncControllerTest({
                dbPath,
                syncAPI: {
                    getFullSync: async () => {
                        return crypto.encryptData(encodeText(content))
                    },
                },
            })

        await setup()
        onTestFinished(cleanup)

        await assertOkResult(syncCtrl.fetchFullDB(ctx))

        let fetched = await assertOkResult(fs.read(ctx, dbPath))

        assert.equal(decodeText(new Uint8Array(fetched)), content)
    })

    test("uploadFullDB", async ({ onTestFinished }) => {
        let dbPath = "syncCtrl_uploadFullDB_test.db"
        let { ctx, setup, cleanup, syncCtrl, crypto, fs } =
            await setupSyncControllerTest({
                dbPath,
                syncAPI: {
                    uploadFullSyncData: async (_, data) => {
                        let decrypted = await crypto.decryptData(
                            new Uint8Array(data),
                        )

                        if (!decrypted.ok) {
                            return decrypted
                        }

                        assert.equal(
                            decodeText(new Uint8Array(decrypted.value)),
                            content,
                        )

                        return Ok(undefined)
                    },
                },
            })

        await setup()
        onTestFinished(cleanup)

        let content = "THIS IS TOTALLY A DATABASE"

        await assertOkResult(fs.write(ctx, dbPath, encodeText(content).buffer))

        await assertOkResult(syncCtrl.uploadFullDB(ctx))
    })

    test("sync", async ({ onTestFinished }) => {
        let localChanges: ChangelogEntry[] = [
            {
                id: newID(),
                source: "local",
                revision: 1,
                targetType: "settings",
                targetID: "controls.vim",
                value: { value: true },
                isSynced: false,
                isApplied: true,
                timestamp: roundToNearestMinutes(addMinutes(new Date(), -5)),
            } satisfies SettingChangelogEntry,
            {
                id: newID(),
                source: "local",
                revision: 1,
                targetType: "settings",
                targetID: "theme.mode",
                value: { value: "light" },
                isSynced: false,
                isApplied: true,
                timestamp: roundToNearestMinutes(addMinutes(new Date(), -5)),
            } satisfies SettingChangelogEntry,
        ]
        let remoteChanges: ChangelogEntry[] = [
            {
                id: newID(),
                source: "remote",
                revision: 1,
                targetType: "settings",
                targetID: "theme.mode",
                value: { value: "dark" },
                isSynced: false,
                isApplied: true,
                timestamp: roundToNearestMinutes(addMinutes(new Date(), 5)),
            } satisfies SettingChangelogEntry,
        ]

        let {
            ctx,
            setup,
            cleanup,
            syncCtrl,
            changelogCtrl,
            settingsCtrl,
            crypto,
        } = await setupSyncControllerTest({
            syncAPI: {
                listChangelogEntries: async (_ctx, _since) => {
                    return encryptChangeLogEntries(
                        crypto,
                        "remote",
                        remoteChanges,
                    )
                },

                uploadChangelogEntries: async (_ctx, entries) => {
                    let decrypted = await decryptChangeLogEntries(
                        crypto,
                        entries,
                    )
                    if (!decrypted.ok) {
                        return decrypted
                    }
                    assert.deepEqual(decrypted.value, localChanges)
                    return Ok(undefined)
                },
            },
        })

        syncCtrl.init(ctx, {
            server: "",
            username: "testuser",
            clientID: "TEST",
        })

        await setup()
        onTestFinished(cleanup)

        await assertOkResult(
            changelogCtrl.insertExternalChangelogEntries(ctx, localChanges),
        )

        await assertOkResult(syncCtrl.sync(ctx))

        let unapplied = await assertOkResult(
            changelogCtrl.listUnapplidChangelogEntries(ctx, {
                pagination: { pageSize: 10 },
            }),
        )
        assert.equal(unapplied.items.length, 0)

        let unsynced = await assertOkResult(
            changelogCtrl.listUnsyncedChangelogEntries(ctx, {
                pagination: { pageSize: 10 },
            }),
        )
        assert.equal(unsynced.items.length, 0)

        let settings = await assertOkResult(settingsCtrl.loadSettings(ctx))

        assert.equal(settings.controls.vim, true)
        assert.equal(settings.theme.mode, "dark")
    })
})

async function setupSyncControllerTest({
    dbPath = "belt_test.db",
    syncAPI,
}: {
    dbPath?: string
    syncAPI?: {
        getFullSync?: (ctx: Context) => AsyncResult<ArrayBufferLike>
        uploadFullSyncData?: (
            ctx: Context,
            data: ArrayBufferLike,
        ) => AsyncResult<void>
        listChangelogEntries?: (
            ctx: Context,
            since?: Date,
        ) => AsyncResult<EncryptedChangelogEntry[]>
        uploadChangelogEntries?: (
            ctx: Context,
            entries: EncryptedChangelogEntry[],
        ) => AsyncResult<void>
    }
}) {
    let [ctx, cancel] = BaseContext.withCancel()

    let fs = new MockFS()
    let db = new SQLite()

    let changelogCtrl = new ChangelogController({
        sourceName: "tests",
        transactioner: db,
        repo: new ChangelogRepo(db),
    })

    let attachmentCtrl = new AttachmentController({
        transactioner: db,
        repo: new AttachmentRepo(db),
        fs,
        hasher: new WebCryptoSha256Hasher(),
        changelog: changelogCtrl,
    })

    let memoCtrl = new MemoController({
        transactioner: db,
        repo: new MemoRepo(db),
        attachments: attachmentCtrl,
        changelog: changelogCtrl,
    })

    let settingsCtrl = new SettingsController({
        transactioner: db,
        repo: new SettingsRepo(db),
        changelog: changelogCtrl,
    })

    let crypto = new AgeCrypto()
    await crypto.init(await toPromise(crypto.generatePrivateKey()))

    let syncCtrl = new SyncController({
        storage: new TestInMemSyncStorage(),
        transactioner: db,
        syncAPIClient: {
            setBaseURL: () => {},
            getFullSync:
                syncAPI?.getFullSync ??
                (async () => Err(new Error("getFullSync unimplemented"))),
            uploadFullSyncData:
                syncAPI?.uploadFullSyncData ??
                (async () =>
                    Err(new Error("uploadFullSyncData unimplemented"))),
            listChangelogEntries:
                syncAPI?.listChangelogEntries ??
                (async () =>
                    Err(new Error("listChangelogEntries unimplemented"))),
            uploadChangelogEntries:
                syncAPI?.uploadChangelogEntries ??
                (async () =>
                    Err(new Error("uploadChangelogEntries unimplemented"))),
        },
        memos: memoCtrl,
        attachments: attachmentCtrl,
        settings: settingsCtrl,
        changelog: changelogCtrl,
        dbPath,
        fs,
        crypto,
    })

    return {
        ctx,
        setup: async () => {
            await db.open(ctx)
        },
        cleanup: async () => {
            cancel()
            await db.close()
        },
        syncCtrl,
        changelogCtrl,
        settingsCtrl,
        crypto,
        fs,
    }
}

async function encryptChangeLogEntries(
    encrypter: Encrypter,
    clientID: string,
    entries: ChangelogEntry[],
): AsyncResult<EncryptedChangelogEntry[]> {
    let encrytpedEntries: EncryptedChangelogEntry[] = []

    for (let entry of entries) {
        let encrypted = await encrypter.encryptData(
            encodeText(JSON.stringify(entry)),
        )
        if (!encrypted.ok) {
            return fmtErr("error encrytping changelog entry: %w", encrypted)
        }

        encrytpedEntries.push({
            syncClientID: clientID,
            data: encodeToBase64(new Uint8Array(encrypted.value)),
            timestamp: entry.timestamp,
        })
    }

    return Ok(encrytpedEntries)
}

async function decryptChangeLogEntries(
    decrypter: Decrypter,
    encrytpedEntries: EncryptedChangelogEntry[],
): AsyncResult<ChangelogEntry[]> {
    let entries: ChangelogEntry[] = []

    for (let entry of encrytpedEntries) {
        let decrypted = await decrypter.decryptData(dataFromBase64(entry.data))
        if (!decrypted.ok) {
            return fmtErr("error decrytping changelog entry: %w", decrypted)
        }

        let parsed = parseJSON<ChangelogEntry, Record<string, any>>(
            decrypted.value,
            (obj) => {
                let timestamp = parseJSONDate(obj.timestamp)
                if (!timestamp.ok) {
                    return timestamp
                }

                return Ok({
                    id: obj.id,
                    source: obj.source,
                    revision: obj.revision,
                    targetType: obj.targetType,
                    targetID: obj.targetID,
                    value: obj.value,
                    isSynced: obj.isSynced,
                    isApplied: obj.isApplied,
                    timestamp: timestamp.value,
                })
            },
        )
        if (!parsed.ok) {
            return parsed
        }

        entries.push(parsed.value)
    }

    return Ok(entries)
}
