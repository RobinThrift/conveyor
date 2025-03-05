import { suite, test, onTestFinished, assert } from "vitest"

import { BaseContext, type Context } from "@/lib/context"
import { assertOkResult } from "@/lib/testhelper/assertions"
import { createKeyFromPassword, decryptData, encryptData } from "@/lib/crypto"
import { type AsyncResult, Err, Ok, toPromise } from "@/lib/result"
import { SQLite } from "@/lib/testhelper/sqlite"
import { MockFS } from "@/lib/testhelper/mockfs"
import type { EncryptedChangelogEntry } from "@/domain/Changelog"
import { decodeText, encodeText } from "@/lib/textencoding"

import { AttachmentStorage } from "../attachments"
import { ChangelogStorage } from "../changelog"
import * as attachmentRepo from "../database/sqlite/attachmentRepo"
import * as changelogRepo from "../database/sqlite/changelogRepo"
import * as memoRepo from "../database/sqlite/memoRepo"
import * as settingRepo from "../database/sqlite/settingsRepo"
import { SettingsStorage } from "../settings"
import { MemoStorage } from "../memos"
import { SyncEngine } from "./syncengine"

suite.sequential("storage/sync/SyncEngine", async () => {
    test("fetchFullDB", async () => {
        let dbPath = "syncEngine_fetchFullDB_test.db"
        let content = "THIS IS TOTALLY A DATABASE"

        let { ctx, setup, cleanup, syncEngine, enckey, fs } =
            await setupSyncEngineTest({
                dbPath,
                syncAPI: {
                    getFullSync: async () => {
                        return encryptData(enckey, encodeText(content))
                    },
                },
            })

        await setup()
        onTestFinished(cleanup)

        await assertOkResult(syncEngine.fetchFullDB(ctx))

        let fetched = await assertOkResult(fs.read(ctx, dbPath))

        assert.equal(decodeText(new Uint8Array(fetched)), content)
    })

    test("uploadFullDB", async () => {
        let dbPath = "syncEngine_uploadFullDB_test.db"
        let { ctx, setup, cleanup, syncEngine, enckey, fs } =
            await setupSyncEngineTest({
                dbPath,
                syncAPI: {
                    uploadFullSyncData: async (_, data) => {
                        let decrypted = await decryptData(
                            enckey,
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

        await assertOkResult(syncEngine.uploadFullDB(ctx))
    })
})

async function setupSyncEngineTest({
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
    let [ctx, cancel] = BaseContext.withData("db", undefined).withCancel()

    let fs = new MockFS()
    let db = new SQLite()

    let changelog = new ChangelogStorage({
        sourceName: "tests",
        db,
        repo: changelogRepo,
    })

    let attachmentStorage = new AttachmentStorage({
        db,
        repo: attachmentRepo,
        fs,
        changelog,
    })

    let memoStorage = new MemoStorage({
        db,
        repo: memoRepo,
        attachments: attachmentStorage,
        changelog,
    })

    let settingStorage = new SettingsStorage({
        db,
        repo: settingRepo,
        changelog,
    })

    let enckey = await toPromise(createKeyFromPassword("lib/fs/encryptedfs"))

    let syncEngine = new SyncEngine({
        syncClientID: "tests",
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
        db,
        memoStorage,
        attachmentStorage,
        settingsStorage: settingStorage,
        changelog,
        dbPath,
        fs,
        enckey,
    })

    return {
        ctx,
        setup: async () => {
            await db.open()
        },
        cleanup: async () => {
            cancel()
            await db.close()
        },
        syncEngine,
        enckey,
        fs,
    }
}
