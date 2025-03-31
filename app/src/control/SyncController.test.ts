import { addMinutes, roundToNearestMinutes } from "date-fns"
import { assert, suite, test } from "vitest"

import type { AccountKey } from "@/domain/AccountKey"
import type {
    AttachmentChangelogEntry,
    ChangelogEntry,
    EncryptedChangelogEntry,
    SettingChangelogEntry,
} from "@/domain/Changelog"
import { newID } from "@/domain/ID"
import type { SyncInfo } from "@/domain/SyncInfo"
import { AgeCrypto } from "@/external/age/AgeCrypto"
import { WebCryptoSha256Hasher } from "@/external/browser/crypto/WebCryptoSha256Hasher"
import { SingleItemKVStore } from "@/lib/KVStore/SingleItemKVStore"
import { dataFromBase64, encodeToBase64 } from "@/lib/base64"
import { BaseContext, type Context } from "@/lib/context"
import type { Decrypter, Encrypter } from "@/lib/crypto"
import { jsonDeserialize, parseJSONDate } from "@/lib/json"
import { type AsyncResult, Err, Ok, fmtErr, toPromise } from "@/lib/result"
import { TestInMemKVStore } from "@/lib/testhelper/TestInMemKVStore"
import { assertOkResult } from "@/lib/testhelper/assertions"
import { MockFS } from "@/lib/testhelper/mockfs"
import { SQLite } from "@/lib/testhelper/sqlite"
import { decodeText, encodeText } from "@/lib/textencoding"
import { AttachmentRepo } from "@/storage/database/sqlite/AttachmentRepo"
import { ChangelogRepo } from "@/storage/database/sqlite/ChangelogRepo"
import { MemoRepo } from "@/storage/database/sqlite/MemoRepo"
import { SettingsRepo } from "@/storage/database/sqlite/SettingsRepo"

import { AttachmentController } from "./AttachmentController"
import { ChangelogController } from "./ChangelogController"
import { CryptoController } from "./CryptoController"
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
                cryptoRemoteAPI: {
                    uploadAccountKey: async (_, accountKey) => {
                        assert.isDefined(accountKey.data)
                        assert.equal(accountKey.type, "agev1")
                        assert.equal(accountKey.name, "primary")
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
            {
                id: newID(),
                source: "local",
                revision: 1,
                targetType: "attachments",
                targetID: newID(),
                value: {
                    created: {
                        filepath: "/a/b/c/d/e/f/g",
                        originalFilename: "test.txt",
                        contentType: "text/plain",
                        sizeBytes: 72,
                        sha256: "ba6d26f67549dc8719ce3a2526b726aed295f3f83aa8c3d11c24dc704272e1d2",
                    },
                },
                isSynced: false,
                isApplied: true,
                timestamp: roundToNearestMinutes(addMinutes(new Date(), -5)),
            } satisfies AttachmentChangelogEntry,
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
            fs,
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

                uploadAttachment: async (_ctx, attachment) => {
                    assert.deepEqual(decodeText(attachment.data), "TEST FILE")
                    assert.deepEqual(attachment.filepath, "/a/b/c/d/e/f/g")
                    return Ok(undefined)
                },
            },
            cryptoRemoteAPI: {
                uploadAccountKey: async (_, accountKey) => {
                    assert.isDefined(accountKey.data)
                    assert.equal(accountKey.type, "agev1")
                    assert.equal(accountKey.name, "primary")
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
            fs.write(ctx, "/a/b/c/d/e/f/g", encodeText("TEST FILE").buffer),
        )

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

        assert.equal(settings.controls.vim, false)
        assert.equal(settings.theme.mode, "dark")
    })
})

async function setupSyncControllerTest({
    dbPath = "conveyor_test.db",
    syncAPI,
    cryptoRemoteAPI,
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
        uploadAttachment?: (
            ctx: Context,
            attachment: {
                filepath: string
                data: Uint8Array<ArrayBufferLike>
            },
        ) => AsyncResult<void>
        registerClient?: (
            ctx: Context,
            syncClient: { clientID: string },
        ) => AsyncResult<void>
    }
    cryptoRemoteAPI?: {
        uploadAccountKey?: (
            ctx: Context,
            accountKey: AccountKey,
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

    let cryptoCtrl = new CryptoController({ crypto })
    await toPromise(
        cryptoCtrl.init(ctx, {
            agePrivateCryptoKey: await toPromise(crypto.generatePrivateKey()),
        }),
    )

    let syncCtrl = new SyncController({
        storage: new SingleItemKVStore<
            typeof SyncController.storageKey,
            SyncInfo
        >(
            SyncController.storageKey,
            new TestInMemKVStore<Record<string, any>>(),
        ),
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
            uploadAttachment:
                syncAPI?.uploadAttachment ??
                (async () => Err(new Error("uploadAttachment unimplemented"))),
            registerClient:
                syncAPI?.registerClient ??
                (async () => Err(new Error("registerClient unimplemented"))),
        },
        cryptoRemoteAPI: {
            uploadAccountKey:
                cryptoRemoteAPI?.uploadAccountKey ??
                (async () => Err(new Error("uploadAccountKey unimplemented"))),
        },
        memos: memoCtrl,
        attachments: attachmentCtrl,
        settings: settingsCtrl,
        changelog: changelogCtrl,
        dbPath,
        fs,
        crypto: cryptoCtrl,
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

        let parsed = jsonDeserialize<ChangelogEntry, Record<string, any>>(
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
