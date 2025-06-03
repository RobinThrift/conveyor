import {
    assert,
    type OnTestFinishedHandler,
    afterAll,
    beforeAll,
    suite,
    test,
    vi,
} from "vitest"

import type { MemoChangelogEntry } from "@/domain/Changelog"
import { newID } from "@/domain/ID"
import type { MemoID, MemoList } from "@/domain/Memo"
import { WebCryptoSha256Hasher } from "@/external/browser/crypto/WebCryptoSha256Hasher"
import { BaseContext, type Context } from "@/lib/context"
import {
    CalendarDateTime,
    calendarDateTimeFromDate,
    currentDateTime,
    isAfter,
    toCalendarDate,
} from "@/lib/i18n"
import { toPromise } from "@/lib/result"
import { assertErrResult, assertOkResult } from "@/lib/testhelper/assertions"
import { MockFS } from "@/lib/testhelper/mockfs"
import { SQLite } from "@/lib/testhelper/sqlite"
import { encodeText } from "@/lib/textencoding"
import { AttachmentRepo } from "@/storage/database/sqlite/AttachmentRepo"
import { ChangelogRepo } from "@/storage/database/sqlite/ChangelogRepo"
import { MemoRepo } from "@/storage/database/sqlite/MemoRepo"

import { AttachmentController } from "./AttachmentController"
import { ChangelogController } from "./ChangelogController"
import { MemoController } from "./MemoController"

suite("control/MemoController", () => {
    suite("Querying", async () => {
        let { memoCtrl, ctx, setup, cleanup } = await memoCtrlTestSetup()

        let now = new CalendarDateTime(2024, 2, 15, 12, 0, 0)
        let numMemos = 500

        let createdMemosIDs: MemoID[] = []

        beforeAll(async () => {
            await setup()

            for (let i = 0; i < numMemos * 1.5; i++) {
                let [created, err] = await memoCtrl.createMemo(ctx, {
                    content: `# Test Memo ${i}\n With some more content for memo ${i}\n #tag-${i}d #parent/tag-${i + 1} #mod-two-is-${i % 2}`,
                    createdAt: now.subtract({ hours: i }).toDate("utc"),
                })
                if (err) {
                    throw err
                }
                createdMemosIDs.push(created.id)
            }

            for (let i = numMemos; i < numMemos * 1.25; i++) {
                let [_, err] = await memoCtrl.updateMemoArchiveStatus(ctx, {
                    id: createdMemosIDs[i],
                    isArchived: true,
                })
                if (err) {
                    throw err
                }
            }

            for (let i = numMemos * 1.25; i < numMemos * 1.5; i++) {
                let [_, err] = await memoCtrl.deleteMemo(
                    ctx,
                    createdMemosIDs[i],
                )
                if (err) {
                    throw err
                }
            }
        })

        afterAll(cleanup)

        test("List All Memos Paginated", async () => {
            let lastMemoDate: Date | undefined = undefined
            let lastMemoID: MemoID | undefined = undefined
            let total = 0

            for (let i = 0; i < numMemos; i += 25) {
                let list: MemoList = await assertOkResult(
                    memoCtrl.listMemos(ctx, {
                        pagination: {
                            pageSize: 25,
                            after: lastMemoDate,
                        },
                    }),
                )

                assert.equal(list.items.length, 25, `i = ${i}`)
                assert.notEqual(lastMemoID, list.items[0].id, `i = ${i}`)

                lastMemoID = list.items.at(-1)?.id
                lastMemoDate = list.next
                total += list.items.length
            }

            assert.equal(total, numMemos)
        })

        test("Filter by exactDate", async () => {
            let list = await assertOkResult(
                memoCtrl.listMemos(ctx, {
                    filter: { exactDate: toCalendarDate(now) },
                    pagination: { pageSize: numMemos },
                }),
            )

            assert.equal(list.items.length, 13)
        })

        test("Filter by startDate", async () => {
            let startDate = now.subtract({ hours: 24 })
            let list = await assertOkResult(
                memoCtrl.listMemos(ctx, {
                    filter: { startDate: toCalendarDate(startDate) },
                    pagination: { pageSize: numMemos },
                }),
            )

            assert.equal(list.items.length, numMemos - 13)
        })

        test("Filter by Tag", async () => {
            let tag = "mod-two-is-1"
            let list = await assertOkResult(
                memoCtrl.listMemos(ctx, {
                    filter: { tag },
                    pagination: { pageSize: numMemos },
                }),
            )

            assert.equal(list.items.length, numMemos / 2)
        })

        test("Filter with Full Text Search Query", async () => {
            let query = "# Test Memo 1*"
            let list = await assertOkResult(
                memoCtrl.listMemos(ctx, {
                    filter: { query },
                    pagination: { pageSize: numMemos },
                }),
            )

            assert.equal(list.items.length, 111, "10-19 + 100-199 inclusive")
        })

        test("Filter by Multiple", async () => {
            let query = "# Test Memo 1*"
            let startDate = now.subtract({ hours: 24 })
            let list = await assertOkResult(
                memoCtrl.listMemos(ctx, {
                    filter: {
                        query,
                        startDate: toCalendarDate(startDate),
                    },
                    pagination: { pageSize: numMemos },
                }),
            )

            assert.equal(
                list.items.length,
                107,
                "107 => the first 4 that start with 1x and are before the min date",
            )
        })

        test("Filter by Tag with Full Text Search Query", async () => {
            let query = "# Test Memo 1*"
            let tag = "mod-two-is-1"
            let list = await assertOkResult(
                memoCtrl.listMemos(ctx, {
                    filter: { query, tag },
                    pagination: { pageSize: numMemos },
                }),
            )

            assert.equal(
                list.items.length,
                56,
                "roundUp(111/2): 111 as explained above, div by 2 because modulus 2 is 1 for half the Memos",
            )
        })

        test("List All Archived Paginated", async () => {
            let lastMemoDate: Date | undefined = undefined
            let lastMemoID: MemoID | undefined = undefined
            let total = 0

            for (let i = numMemos; i < numMemos * 1.25; i += 25) {
                let list: MemoList = await assertOkResult(
                    memoCtrl.listMemos(ctx, {
                        filter: { isArchived: true },
                        pagination: {
                            pageSize: 25,
                            after: lastMemoDate,
                        },
                    }),
                )

                assert.equal(list.items.length, 25, `i = ${i}`)
                assert.notEqual(lastMemoID, list.items[0].id, `i = ${i}`)

                lastMemoID = list.items.at(-1)?.id
                lastMemoDate = list.next
                total += list.items.length

                for (let memo of list.items) {
                    assert.isTrue(memo.isArchived, `memo.id = ${memo.id}`)
                }
            }

            assert.equal(total, numMemos * 0.25)
        })

        test("List All Deleted Paginated", async () => {
            let lastMemoDate: Date | undefined = undefined
            let lastMemoID: MemoID | undefined = undefined
            let total = 0

            for (let i = numMemos; i < numMemos * 1.25; i += 25) {
                let list: MemoList = await assertOkResult(
                    memoCtrl.listMemos(ctx, {
                        filter: { isDeleted: true },
                        pagination: {
                            pageSize: 25,
                            after: lastMemoDate,
                        },
                    }),
                )

                assert.equal(list.items.length, 25, `i = ${i}`)
                assert.notEqual(lastMemoID, list.items[0].id, `i = ${i}`)

                lastMemoID = list.items.at(-1)?.id
                lastMemoDate = list.next
                total += list.items.length

                for (let memo of list.items) {
                    assert.isTrue(memo.isDeleted, `memo.id = ${memo.id}`)
                }
            }

            assert.equal(total, numMemos * 0.25)
        })
    })

    suite(
        "CRUD",
        async () => {
            let insertMemos = async (
                ctx: Context,
                memoCtrl: MemoController,
                now = new CalendarDateTime(2024, 2, 15, 12, 0, 0, 0),
                numMemos = 10,
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

            test("createMemo/changelog", async ({ onTestFinished }) => {
                let { memoCtrl, changelogCtrl, ctx, setup } =
                    await memoCtrlTestSetup({ onTestFinished })
                await setup()

                let now = new Date(2024, 2, 15, 12, 0, 0, 0)
                let numMemos = 10

                let content =
                    "# Test Memo to Check Changelog\nMemo content here."
                let created = await assertOkResult(
                    memoCtrl.createMemo(ctx, {
                        content,
                        createdAt: now,
                    }),
                )
                assert.isDefined(created)

                let changes = await assertOkResult(
                    changelogCtrl.listUnsyncedChangelogEntries(ctx, {
                        pagination: { pageSize: numMemos * 100 },
                    }),
                )

                assert.isTrue(changes.items.length >= 1)

                let entry = changes.items.find(
                    (e) => e.targetID === created.id,
                ) as MemoChangelogEntry
                assert.equal(entry.source, "tests")
                assert.equal(entry.revision, 1)
                assert.equal(entry.targetType, "memos")
                assert.equal(entry.targetID, created.id)
                assert.deepEqual(entry.value, {
                    created: {
                        ...created,
                    },
                })
                assert.isFalse(entry.isSynced)
                assert.isTrue(entry.isApplied)
            })

            test("getMemo", async ({ onTestFinished }) => {
                let { memoCtrl, ctx, setup } = await memoCtrlTestSetup({
                    onTestFinished,
                })
                await setup()

                let now = new CalendarDateTime(2024, 2, 15, 12, 0, 0, 0)
                let createdMemosIDs = await insertMemos(ctx, memoCtrl, now)

                let result = await assertOkResult(
                    memoCtrl.getMemo(ctx, createdMemosIDs[1]),
                )
                assert.isDefined(result)
            })

            test("getMemo/Not Found", async ({ onTestFinished }) => {
                let { memoCtrl, ctx, setup } = await memoCtrlTestSetup({
                    onTestFinished,
                })
                await setup()

                let now = new CalendarDateTime(2024, 2, 15, 12, 0, 0, 0)
                await insertMemos(ctx, memoCtrl, now)

                let error = await assertErrResult(
                    memoCtrl.getMemo(ctx, "INVALID_ID"),
                )
                assert.isDefined(error)
                assert.include(error.message, "not found")
            })

            test("updateMemo", async ({ onTestFinished }) => {
                let { memoCtrl, ctx, setup } = await memoCtrlTestSetup({
                    onTestFinished,
                })
                await setup()

                let now = new CalendarDateTime(2024, 2, 15, 12, 0, 0, 0)
                let createdMemosIDs = await insertMemos(ctx, memoCtrl, now)

                let memo = await assertOkResult(
                    memoCtrl.getMemo(ctx, createdMemosIDs[2]),
                )
                memo.content = "Updated Content for Memo 2"

                vi.useFakeTimers()
                vi.setSystemTime(
                    calendarDateTimeFromDate(memo.updatedAt)
                        .add({ hours: 1 })
                        .toDate("utc"),
                )
                await assertOkResult(
                    memoCtrl.updateMemoContent(ctx, {
                        ...memo,
                        changes: {
                            version: "1",
                            changes: [{ insert: "Updated Content for Memo 2" }],
                        },
                    }),
                )
                vi.useRealTimers()

                let updated = await assertOkResult(
                    memoCtrl.getMemo(ctx, createdMemosIDs[2]),
                )

                assert.equal(updated.content, memo.content)
                assert.isTrue(isAfter(updated.updatedAt, memo.updatedAt))
            })

            test("updateMemo/Not Found", async ({ onTestFinished }) => {
                let { memoCtrl, ctx, setup } = await memoCtrlTestSetup({
                    onTestFinished,
                })
                await setup()
                await insertMemos(ctx, memoCtrl)

                let error = await assertErrResult(
                    memoCtrl.updateMemoContent(ctx, {
                        id: "99",
                        content: "Updated Content for Memo 99",
                        changes: {
                            version: "1",
                            changes: [
                                { insert: "Updated Content for Memo 99" },
                            ],
                        },
                    }),
                )
                assert.isDefined(error)
                assert.include(error.message, "not found")
            })

            test("updateMemoArchiveStatus", async ({ onTestFinished }) => {
                let { memoCtrl, ctx, setup } = await memoCtrlTestSetup({
                    onTestFinished,
                })
                await setup()
                let createdMemosIDs = await insertMemos(ctx, memoCtrl)

                let memo = await assertOkResult(
                    memoCtrl.getMemo(ctx, createdMemosIDs[5]),
                )

                vi.useFakeTimers()
                vi.setSystemTime(
                    calendarDateTimeFromDate(memo.updatedAt)
                        .add({ hours: 1 })
                        .toDate("utc"),
                )
                await assertOkResult(
                    memoCtrl.updateMemoArchiveStatus(ctx, {
                        id: memo.id,
                        isArchived: true,
                    }),
                )
                vi.useRealTimers()

                let updated = await assertOkResult(
                    memoCtrl.getMemo(ctx, memo.id),
                )

                assert.isTrue(updated.isArchived)
                assert.isTrue(
                    isAfter(updated.updatedAt, memo.updatedAt),
                    `updated.updatedAt: ${updated.updatedAt} memo.updatedAt: ${memo.updatedAt}`,
                )

                vi.useFakeTimers()
                vi.setSystemTime(
                    calendarDateTimeFromDate(memo.updatedAt)
                        .add({ hours: 1 })
                        .toDate("utc"),
                )
                await assertOkResult(
                    memoCtrl.updateMemoArchiveStatus(ctx, {
                        id: memo.id,
                        isArchived: false,
                    }),
                )
                vi.useRealTimers()

                let noLongerArchived = await assertOkResult(
                    memoCtrl.getMemo(ctx, memo.id),
                )

                assert.isFalse(noLongerArchived.isArchived)
                assert.isTrue(
                    isAfter(noLongerArchived.updatedAt, memo.updatedAt),
                )
            })

            test("updateMemoArchiveStatus/Not Found", async ({
                onTestFinished,
            }) => {
                let { memoCtrl, ctx, setup } = await memoCtrlTestSetup({
                    onTestFinished,
                })
                await setup()
                await insertMemos(ctx, memoCtrl)

                let error = await assertErrResult(
                    memoCtrl.updateMemoArchiveStatus(ctx, {
                        id: "INVALID_ID",
                        isArchived: true,
                    }),
                )
                assert.isDefined(error)
                assert.include(error.message, "not found")
            })

            test("deleteMemo", async ({ onTestFinished }) => {
                let { memoCtrl, ctx, setup } = await memoCtrlTestSetup({
                    onTestFinished,
                })
                await setup()

                let created = await assertOkResult(
                    memoCtrl.createMemo(ctx, {
                        content: "Memo To Be Deleted",
                    }),
                )

                let now = currentDateTime()
                vi.useFakeTimers()
                vi.setSystemTime(now.add({ hours: 1 }).toDate("utc"))
                await assertOkResult(memoCtrl.deleteMemo(ctx, created.id))
                vi.useRealTimers()

                let deleted = await assertOkResult(
                    memoCtrl.getMemo(ctx, created.id),
                )

                assert.isTrue(deleted.isDeleted)
                assert.isTrue(isAfter(deleted.updatedAt, created.updatedAt))

                vi.useFakeTimers()
                vi.setSystemTime(now.add({ days: 40 }).toDate("utc"))
                await assertOkResult(memoCtrl.cleanupDeletedMemos(ctx))
                vi.useRealTimers()

                let error = await assertErrResult(
                    memoCtrl.getMemo(ctx, created.id),
                )
                assert.isDefined(error)
                assert.include(error?.message, "not found")
            })

            test("undeleteMemo", async ({ onTestFinished }) => {
                let { memoCtrl, ctx, setup } = await memoCtrlTestSetup({
                    onTestFinished,
                })
                await setup()
                let createdMemosIDs = await insertMemos(ctx, memoCtrl)

                let memo = await assertOkResult(
                    memoCtrl.getMemo(ctx, createdMemosIDs[8]),
                )

                vi.useFakeTimers()
                vi.setSystemTime(
                    calendarDateTimeFromDate(memo.updatedAt)
                        .add({ hours: 1 })
                        .toDate("utc"),
                )
                await assertOkResult(memoCtrl.deleteMemo(ctx, memo.id))
                vi.useRealTimers()

                let deleted = await assertOkResult(
                    memoCtrl.getMemo(ctx, memo.id),
                )

                assert.isTrue(deleted.isDeleted)
                assert.isTrue(isAfter(deleted.updatedAt, memo.updatedAt))

                await assertOkResult(memoCtrl.undeleteMemo(ctx, memo.id))

                let undeleted = await assertOkResult(
                    memoCtrl.getMemo(ctx, memo.id),
                )

                assert.isFalse(undeleted.isDeleted)
                assert.isTrue(isAfter(deleted.updatedAt, memo.updatedAt))
            })

            test("deleteMemo/Not Found", async ({ onTestFinished }) => {
                let { memoCtrl, ctx, setup } = await memoCtrlTestSetup({
                    onTestFinished,
                })
                await setup()
                await insertMemos(ctx, memoCtrl)

                let error = await assertErrResult(
                    memoCtrl.deleteMemo(ctx, "INVALID_ID"),
                )
                assert.isDefined(error)
                assert.include(error?.message, "not found")
            })
        },
        30000,
    )

    suite("Tags", async () => {
        let insertMemos = async (
            ctx: Context,
            memoCtrl: MemoController,
            numMemos = 10,
            now = new CalendarDateTime(2024, 2, 15, 12, 0, 0, 0),
        ) => {
            let createdMemosIDs: MemoID[] = []
            for (let i = 0; i < numMemos; i++) {
                let [created, err] = await memoCtrl.createMemo(ctx, {
                    content: `# Test Memo ${i}\n With some more content for memo ${i} #tag-${i} #shared-tag`,
                    createdAt: now.subtract({ hours: i }).toDate("utc"),
                })
                if (err) {
                    throw err
                }
                createdMemosIDs.push(created.id)
            }

            return createdMemosIDs
        }

        test("Tags for newly created Memos exist", async ({
            onTestFinished,
        }) => {
            let { memoCtrl, ctx, setup } = await memoCtrlTestSetup({
                onTestFinished,
            })
            await setup()

            let numMemos = 10
            await insertMemos(ctx, memoCtrl, numMemos)

            let tags = await assertOkResult(
                memoCtrl.listTags(ctx, {
                    pagination: { pageSize: numMemos * 2 },
                }),
            )

            assert.equal(
                tags.items.length,
                numMemos + 1,
                "one for each unique memo tag and one extra for the shared tag",
            )

            for (let tag of tags.items) {
                if (tag.tag === "shared-tag") {
                    assert.equal(tag.count, numMemos)
                } else {
                    assert.equal(tag.count, 1)
                }
            }
        })

        test("Tag count doesn't change after Memo update if no tags were added or removed", async ({
            onTestFinished,
        }) => {
            let { memoCtrl, ctx, setup } = await memoCtrlTestSetup({
                onTestFinished,
            })
            await setup()

            let numMemos = 10
            let createdMemosIDs = await insertMemos(ctx, memoCtrl, numMemos)

            for (let i = 0; i < numMemos; i++) {
                await assertOkResult(
                    memoCtrl.updateMemoContent(ctx, {
                        id: createdMemosIDs[i],
                        content: `# Test Memo ${i}\n Updated content for memo ${i} #tag-${i} #shared-tag`,
                        changes: {
                            version: "1",
                            changes: [
                                {
                                    insert: `# Test Memo ${i}\n Updated content for memo ${i} #tag-${i} #shared-tag`,
                                },
                            ],
                        },
                    }),
                )
            }

            let tags = await assertOkResult(
                memoCtrl.listTags(ctx, {
                    pagination: { pageSize: numMemos * 2 },
                }),
            )

            assert.equal(
                tags.items.length,
                numMemos + 1,
                "one for each unique memo tag and one extra for the shared tag",
            )

            for (let tag of tags.items) {
                if (tag.tag === "shared-tag") {
                    assert.equal(tag.count, numMemos)
                } else {
                    assert.equal(tag.count, 1)
                }
            }
        })

        test("Tags are removed when count reaches 0", async ({
            onTestFinished,
        }) => {
            let { memoCtrl, ctx, setup } = await memoCtrlTestSetup({
                onTestFinished,
            })
            await setup()

            let numMemos = 10
            let createdMemosIDs = await insertMemos(ctx, memoCtrl, numMemos)

            // Update Memos, removing unique tags tags
            for (let i = 0; i < numMemos; i++) {
                await memoCtrl.updateMemoContent(ctx, {
                    id: createdMemosIDs[i],
                    content: `# Test Memo ${i}\n Updated content for memo ${i} #shared-tag`,
                    changes: {
                        version: "1",
                        changes: [
                            {
                                insert: `# Test Memo ${i}\n Updated content for memo ${i} #shared-tag`,
                            },
                        ],
                    },
                })
            }

            let tags = await assertOkResult(
                memoCtrl.listTags(ctx, {
                    pagination: { pageSize: numMemos * 2 },
                }),
            )

            assert.equal(tags.items.length, 1)

            assert.equal(tags.items[0].count, numMemos)
        })

        test("Tag count is reduced when Memos are deleted", async ({
            onTestFinished,
        }) => {
            let { memoCtrl, ctx, setup } = await memoCtrlTestSetup({
                onTestFinished,
            })
            await setup()

            let numMemos = 10
            let createdMemosIDs = await insertMemos(ctx, memoCtrl, numMemos)

            let expectedDeletedTags: string[] = []
            for (let i = 0; i < numMemos / 2; i++) {
                expectedDeletedTags.push(`tag-${i}`)
                await assertOkResult(
                    memoCtrl.deleteMemo(ctx, createdMemosIDs[i]),
                )
            }

            let tags = await assertOkResult(
                memoCtrl.listTags(ctx, {
                    pagination: { pageSize: numMemos * 2 },
                }),
            )

            assert.equal(tags.items.length, numMemos / 2 + 1)

            for (let tag of tags.items) {
                assert.notOk(expectedDeletedTags.includes(tag.tag))
                if (tag.tag === "shared-tag") {
                    assert.equal(tag.count, numMemos / 2)
                } else {
                    assert.equal(tag.count, 1)
                }
            }
        })
    })

    suite("Attachments", async () => {
        let { memoCtrl, attachmentCtrl, ctx, setup, cleanup } =
            await memoCtrlTestSetup()

        beforeAll(setup)
        afterAll(cleanup)

        test("Attachments", async () => {
            let attachmentContent = encodeText("# Attachment Test")
            let buf = new ArrayBuffer(attachmentContent.byteLength)
            new Uint8Array(buf).set(attachmentContent, 0)

            let attachmentID = await assertOkResult(
                attachmentCtrl.createAttachment(ctx, {
                    filename: "file_a.txt",
                    content: buf,
                }),
            )

            let content = `# Test Memo to Check Changelog\nMemo content here.\n[text for attachment link](attachment://${attachmentID})`
            let created = await assertOkResult(
                memoCtrl.createMemo(ctx, {
                    content,
                    createdAt: new Date(),
                }),
            )
            assert.isDefined(created)

            let attachmentsForMemo = await assertOkResult(
                attachmentCtrl.listAttachmentsForMemo(ctx, created.id),
            )
            assert.equal(attachmentsForMemo.length, 1)

            attachmentContent = encodeText("# Other Attachment Content")
            buf = new ArrayBuffer(attachmentContent.byteLength)
            new Uint8Array(buf).set(attachmentContent, 0)

            let attachmentID2 = await assertOkResult(
                attachmentCtrl.createAttachment(ctx, {
                    filename: "file_b.txt",
                    content: buf,
                }),
            )

            content = `# Test Memo to Check Changelog\nMemo content here.\n[text for file_b](attachment://${attachmentID2})`
            await assertOkResult(
                memoCtrl.updateMemoContent(ctx, {
                    id: created.id,
                    content,
                    changes: {
                        version: "1",
                        changes: [{ insert: content }],
                    },
                }),
            )
        })
    })

    suite("applyChangelogEntries", async () => {
        let now = new CalendarDateTime(2024, 2, 15, 12, 0, 0, 0)

        test("exisitng Memo", async ({ onTestFinished }) => {
            let { memoCtrl, ctx, setup, insertChangelogEntries } =
                await memoCtrlTestSetup({ onTestFinished })
            await setup()

            let { id } = await assertOkResult(
                memoCtrl.createMemo(ctx, {
                    content:
                        "# Test Memo 0\n With some more content for memo 0",
                    createdAt: now.subtract({ hours: 1 }).toDate("utc"),
                }),
            )

            let entries = await insertChangelogEntries([
                {
                    targetID: id,
                    value: {
                        content: {
                            version: "1",
                            changes: [
                                { retain: 48 },
                                { insert: "\n\nA new line for Memo 0." },
                            ],
                        },
                    },
                },
            ])

            await assertOkResult(memoCtrl.applyChangelogEntries(ctx, entries))

            let updated = await assertOkResult(memoCtrl.getMemo(ctx, id))

            assert.equal(
                updated.content,
                "# Test Memo 0\n With some more content for memo 0\n\nA new line for Memo 0.",
            )
        })

        test("new Memo", async ({ onTestFinished }) => {
            let { memoCtrl, ctx, setup, cleanup } = await memoCtrlTestSetup({
                onTestFinished,
            })
            await setup()
            onTestFinished(() => cleanup())

            let newMemoID = newID()
            await assertOkResult(
                memoCtrl.applyChangelogEntries(ctx, [
                    {
                        id: newID(),
                        source: "tests",
                        revision: 1,
                        targetType: "memos",
                        targetID: newMemoID,
                        isSynced: false,
                        isApplied: false,
                        timestamp: new Date(),
                        value: {
                            created: {
                                content: "# Memo 1\nCreated using a changelog",
                                isArchived: false,
                                isDeleted: false,
                                createdAt: now.toDate("utc"),
                                updatedAt: now.toDate("utc"),
                            },
                        },
                    },
                ]),
            )

            let created = await assertOkResult(memoCtrl.getMemo(ctx, newMemoID))

            assert.equal(created.content, "# Memo 1\nCreated using a changelog")
        })

        test("Conflicting Change", async ({ onTestFinished }) => {
            let { memoCtrl, ctx, setup, insertChangelogEntries } =
                await memoCtrlTestSetup({ onTestFinished })
            await setup()

            let { id } = await assertOkResult(
                memoCtrl.createMemo(ctx, {
                    content: `Line 1 to change

Line 2 will be shortened

Line 3 unchanged

Line 4 unchanged`,
                    createdAt: now.subtract({ hours: 1 }).toDate("utc"),
                }),
            )

            let expected = `Line 1 changed

Line 2 shortened

Line 3 unchanged

Line 3.5 added

Line 4 unchanged`

            let entries = await insertChangelogEntries([
                {
                    targetID: id,
                    value: {
                        content: {
                            version: "1",
                            changes: [
                                { retain: 25 },
                                { delete: 17 },
                                { insert: "shortened" },
                            ],
                        },
                    },
                },
                {
                    targetID: id,
                    value: {
                        content: {
                            version: "1",
                            changes: [
                                { retain: 60 },
                                { insert: "\n\nLine 3.5 added" },
                            ],
                        },
                    },
                },
                {
                    targetID: id,
                    value: {
                        content: {
                            version: "1",
                            changes: [
                                { retain: 7 },
                                { delete: 9 },
                                { insert: "changed" },
                            ],
                        },
                    },
                },
            ])

            await assertOkResult(memoCtrl.applyChangelogEntries(ctx, entries))

            let updated = await assertOkResult(memoCtrl.getMemo(ctx, id))

            assert.equal(
                updated.content,
                expected,
                `acutal: \n${updated.content}\n\nexpected: \n${expected}`,
            )
        })
    })
})

async function memoCtrlTestSetup({
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
                isSynced: true,
                syncedAt: now
                    .subtract({ minutes: entries.length - i + 1 })
                    .toDate("utc"),
                isApplied: false,
                timestamp: now
                    .subtract({ minutes: entries.length - i })
                    .toDate("utc"),
            } satisfies MemoChangelogEntry

            toCreate.push(entry)
        }

        await toPromise(
            changelogCtrl.insertExternalChangelogEntries(ctx, toCreate),
        )

        return toCreate
    }

    let cleanup = async () => {
        cancel()
        await db.close()
    }

    onTestFinished?.(cleanup)

    return {
        ctx,
        memoCtrl,
        changelogCtrl,
        attachmentCtrl,
        insertChangelogEntries,
        setup: async () => {
            await db.open(ctx)
        },
        cleanup,
    }
}
