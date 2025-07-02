import { assert, type OnTestFinishedHandler, suite, test } from "vitest"

import { AttachmentController } from "@/control/AttachmentController"
import { ChangelogController } from "@/control/ChangelogController"
import { MemoController } from "@/control/MemoController"
import type { MemoChangelogEntry } from "@/domain/Changelog"
import { newID } from "@/domain/ID"
import type { MemoID } from "@/domain/Memo"
import { WebCryptoSha256Hasher } from "@/external/browser/crypto/WebCryptoSha256Hasher"
import { BaseContext, type Context } from "@/lib/context"
import { CalendarDateTime, currentDateTime } from "@/lib/i18n"
import { toPromise } from "@/lib/result"
import { assertOkResult } from "@/lib/testhelper/assertions"
import { MockFS } from "@/lib/testhelper/mockfs"
import { SQLite } from "@/lib/testhelper/sqlite"
import { AttachmentRepo } from "@/storage/database/sqlite/AttachmentRepo"
import { ChangelogRepo } from "@/storage/database/sqlite/ChangelogRepo"
import { MemoRepo } from "@/storage/database/sqlite/MemoRepo"
import { CleanupJob } from "./CleanupJob"

suite("jobs/CleanupJob", () => {
    test("orphaned memo changelog entries", async ({ onTestFinished }) => {
        let { ctx, job, insertChangelogEntries, insertMemos, changelogCtrl } =
            await cleanupJobTestSetup({ onTestFinished })

        await insertChangelogEntries(
            ["non-existing-memo-0", "non-existing-memo-1"].map((memoID) => ({
                targetID: memoID,
                value: {
                    content: { version: "1", changes: [{ insert: "" }] },
                },
            })),
        )

        let insertedMemos = await insertMemos(ctx, 10)

        await insertChangelogEntries(
            ["non-existing-memo-2", "non-existing-memo-3"].map((memoID) => ({
                targetID: memoID,
                value: {
                    content: { version: "1", changes: [{ insert: "" }] },
                },
            })),
        )

        await assertOkResult(job.run(ctx))

        let entries = await assertOkResult(
            changelogCtrl.listUnsyncedChangelogEntries(ctx, {
                pagination: { pageSize: 50 },
            }),
        )

        assert.equal(entries.items.length, insertedMemos.length)
    })
})

async function cleanupJobTestSetup({
    onTestFinished,
}: {
    onTestFinished?: (fn: OnTestFinishedHandler, timeout?: number) => void
} = {}) {
    let [ctx, cancel] = BaseContext.withCancel()

    let db = new SQLite()
    let fs = new MockFS()

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

    let insertChangelogEntries = async (
        entries: Pick<MemoChangelogEntry, "targetID" | "value">[],
    ): Promise<MemoChangelogEntry[]> => {
        let now = currentDateTime()
        let toCreate = [] as MemoChangelogEntry[]

        for (let i = 0; i < entries.length; i++) {
            let entry = {
                ...entries[i],
                id: newID(),
                source: "insertChangelogEntries",
                revision: i,
                targetType: "memos",
                isSynced: false,
                isApplied: true,
                timestamp: now.subtract({ minutes: entries.length - i }).toDate("utc"),
            } satisfies MemoChangelogEntry

            toCreate.push(entry)
        }

        await toPromise(changelogCtrl.insertExternalChangelogEntries(ctx, toCreate))

        return toCreate
    }

    let insertMemos = async (
        ctx: Context,
        numMemos: number,
        now = new CalendarDateTime(2024, 2, 15, 12, 0, 0, 0),
    ) => {
        let createdMemosIDs: MemoID[] = []
        for (let i = 0; i < numMemos; i++) {
            let [created, err] = await memoCtrl.createMemo(ctx, {
                content: `# Test Memo ${i}\n With some more content for memo ${i}`,
                createdAt: now.subtract({ hours: i }).toDate("utc"),
            })
            if (err) {
                throw err
            }
            createdMemosIDs.push(created.id)
        }

        return createdMemosIDs
    }

    let cleanup = async () => {
        cancel()
        await db.close()
    }

    onTestFinished?.(cleanup)

    await db.open(ctx)

    return {
        ctx,
        job: new CleanupJob({ memoCtrl, changelogCtrl }),
        changelogCtrl,
        insertChangelogEntries,
        insertMemos,
        cleanup,
    }
}
