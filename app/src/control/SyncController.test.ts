import { assert, onTestFinished, suite, test } from "vitest"

import type { EncryptedChangelogEntry } from "@/domain/Changelog"
import { WebCryptoSha256Hasher } from "@/external/browser/crypto/WebCryptoSha256Hasher"
import { BaseContext, type Context } from "@/lib/context"
import { type AsyncResult, Err, Ok } from "@/lib/result"
import { assertOkResult } from "@/lib/testhelper/assertions"
import { MockFS } from "@/lib/testhelper/mockfs"
import { SQLite } from "@/lib/testhelper/sqlite"
import { decodeText, encodeText } from "@/lib/textencoding"
import { AttachmentRepo } from "@/storage/database/sqlite/AttachmentRepo"
import { ChangelogRepo } from "@/storage/database/sqlite/ChangelogRepo"
import { MemoRepo } from "@/storage/database/sqlite/MemoRepo"
import { SettingsRepo } from "@/storage/database/sqlite/SettingsRepo"
import { AgeCrypto } from "@/external/age/AgeCrypto"

import { AttachmentController } from "./AttachmentController"
import { ChangelogController } from "./ChangelogController"
import { MemoController } from "./MemoController"
import { SettingsController } from "./SettingsController"
import { SyncController } from "./SyncController"

suite.sequential("control/SyncController", async () => {
    test("fetchFullDB", async () => {
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

    test("uploadFullDB", async () => {
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
    await crypto.init("control/SyncController")

    let syncCtrl = new SyncController({
        syncClientID: "tests",
        transactioner: db,
        syncAPIClient: {
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
        crypto,
        fs,
    }
}
