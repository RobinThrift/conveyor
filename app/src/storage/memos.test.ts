import { addDays, addHours, isAfter, subHours } from "date-fns"
import {
    assert,
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    suite,
    test,
    vi,
} from "vitest"

import type { MemoChangelogEntry, MemoContentChanges } from "@/domain/Changelog"
import type { MemoID, MemoList } from "@/domain/Memo"
import { BaseContext } from "@/lib/context"
import { assertErrResult, assertOkResult } from "@/lib/testhelper/assertions"
import { SQLite } from "@/lib/testhelper/sqlite"

import { AttachmentStorage } from "./attachments"
import { ChangelogStorage } from "./changelog"
import * as attachmentRepo from "./database/sqlite/attachmentRepo"
import * as changelogRepo from "./database/sqlite/changelogRepo"
import * as memoRepo from "./database/sqlite/memoRepo"
import { MemoStorage } from "./memos"
import { encodeText } from "@/lib/textencoding"
import { MockFS } from "@/lib/testhelper/mockfs"
import { newID } from "@/domain/ID"
import { dateFromSQLite, dateToSQLite } from "./database/sqlite/types/datetime"

suite.sequential("storage/memos", () => {
    suite.sequential("Querying", async () => {
        let [ctx, cancel] = BaseContext.withData("db", undefined).withCancel()
        let db = new SQLite()
        let memoStorage = new MemoStorage({
            db,
            repo: memoRepo,
            attachments: new AttachmentStorage({
                db,
                repo: attachmentRepo,
            } as any),
            changelog: new ChangelogStorage({
                sourceName: "tests",
                db,
                repo: changelogRepo,
            }),
        })

        let now = new Date(2024, 2, 15, 12, 0, 0, 0)
        let numMemos = 500

        let createdMemosIDs: MemoID[] = []

        beforeAll(async () => {
            await db.open()

            for (let i = 0; i < numMemos * 1.5; i++) {
                let res = await memoStorage.createMemo(ctx, {
                    content: `# Test Memo ${i}\n With some more content for memo ${i}\n #tag-${i}d #parent/tag-${i + 1} #mod-two-is-${i % 2}`,
                    createdAt: subHours(now, i),
                })
                if (!res.ok) {
                    throw res.err
                }
                createdMemosIDs.push(res.value.id)
            }

            for (let i = numMemos; i < numMemos * 1.25; i++) {
                let res = await memoStorage.updateMemoArchiveStatus(ctx, {
                    id: createdMemosIDs[i],
                    isArchived: true,
                })
                if (!res.ok) {
                    throw res.err
                }
            }

            for (let i = numMemos * 1.25; i < numMemos * 1.5; i++) {
                let res = await memoStorage.deleteMemo(ctx, createdMemosIDs[i])
                if (!res.ok) {
                    throw res.err
                }
            }
        })

        afterAll(async () => {
            cancel()
            await db.close()
        })

        test("List All Memos Paginated", async () => {
            let lastMemoDate: Date | undefined = undefined
            let lastMemoID: MemoID | undefined = undefined
            let total = 0

            for (let i = 0; i < numMemos; i += 25) {
                let list: MemoList = await assertOkResult(
                    memoStorage.listMemos(ctx, {
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
                memoStorage.listMemos(ctx, {
                    filter: { exactDate: now },
                    pagination: { pageSize: numMemos },
                }),
            )

            assert.equal(list.items.length, 13)
        })

        test("Filter by startDate", async () => {
            let startDate = subHours(now, 24)
            let list = await assertOkResult(
                memoStorage.listMemos(ctx, {
                    filter: { startDate },
                    pagination: { pageSize: numMemos },
                }),
            )

            assert.equal(list.items.length, numMemos - 13)
        })

        test("Filter by Tag", async () => {
            let tag = "mod-two-is-1"
            let list = await assertOkResult(
                memoStorage.listMemos(ctx, {
                    filter: { tag },
                    pagination: { pageSize: numMemos },
                }),
            )

            assert.equal(list.items.length, numMemos / 2)
        })

        test("Filter with Full Text Search Query", async () => {
            let query = "# Test Memo 1*"
            let list = await assertOkResult(
                memoStorage.listMemos(ctx, {
                    filter: { query },
                    pagination: { pageSize: numMemos },
                }),
            )

            assert.equal(list.items.length, 111, "10-19 + 100-199 inclusive")
        })

        test("Filter by Multiple", async () => {
            let query = "# Test Memo 1*"
            let startDate = subHours(now, 24)
            let list = await assertOkResult(
                memoStorage.listMemos(ctx, {
                    filter: { query, startDate },
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
                memoStorage.listMemos(ctx, {
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
                    memoStorage.listMemos(ctx, {
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
                    memoStorage.listMemos(ctx, {
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

    suite.concurrent(
        "CRUD",
        () => {
            let [ctx, cancel] = BaseContext.withData(
                "db",
                undefined,
            ).withCancel()
            let db = new SQLite()
            let changelog = new ChangelogStorage({
                sourceName: "tests",
                db,
                repo: changelogRepo,
            })
            let memoStorage = new MemoStorage({
                db,
                repo: memoRepo,
                attachments: new AttachmentStorage({
                    db,
                    repo: attachmentRepo,
                } as any),
                changelog,
            })

            let now = new Date(2024, 2, 15, 12, 0, 0, 0)
            let numMemos = 10
            let createdMemosIDs: MemoID[] = []

            beforeAll(async () => {
                await db.open()

                for (let i = 0; i < numMemos; i++) {
                    let res = await memoStorage.createMemo(ctx, {
                        content: `# Test Memo ${i}\n With some more content for memo ${i}`,
                        createdAt: subHours(now, i),
                    })
                    if (!res.ok) {
                        throw res.err
                    }
                    createdMemosIDs.push(res.value.id)
                }
            })

            afterAll(async () => {
                cancel()
                await db.close()
            })

            test("createMemo/changelog", async () => {
                let content =
                    "# Test Memo to Check Changelog\nMemo content here."
                let created = await assertOkResult(
                    memoStorage.createMemo(ctx, {
                        content,
                        createdAt: now,
                    }),
                )
                assert.isDefined(created)

                let changes = await assertOkResult(
                    changelog.listUnsyncedChangelogEntries(ctx, {
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

            test("getMemo", async () => {
                let result = await assertOkResult(
                    memoStorage.getMemo(ctx, createdMemosIDs[1]),
                )
                assert.isDefined(result)
            })

            test("getMemo/Not Found", async () => {
                let error = await assertErrResult(
                    memoStorage.getMemo(ctx, "INVALID_ID"),
                )
                assert.isDefined(error)
                assert.include(error.message, "not found")
            })

            test("updateMemo", async () => {
                let memo = await assertOkResult(
                    memoStorage.getMemo(ctx, createdMemosIDs[2]),
                )
                memo.content = "Updated Content for Memo 2"

                vi.useFakeTimers()
                vi.setSystemTime(addHours(memo.updatedAt, 1))
                await assertOkResult(
                    memoStorage.updateMemoContent(ctx, {
                        ...memo,
                        changes: {
                            version: "1",
                            changes: [[0, "Updated Content for Memo 2"]],
                        },
                    }),
                )
                vi.useRealTimers()

                let updated = await assertOkResult(
                    memoStorage.getMemo(ctx, createdMemosIDs[2]),
                )

                assert.equal(updated.content, memo.content)
                assert.isTrue(isAfter(updated.updatedAt, memo.updatedAt))
            })

            test("updateMemo/Not Found", async () => {
                let error = await assertErrResult(
                    memoStorage.updateMemoContent(ctx, {
                        id: "99",
                        content: "Updated Content for Memo 99",
                        changes: {
                            version: "1",
                            changes: [[0, "Updated Content for Memo 99"]],
                        },
                    }),
                )
                assert.isDefined(error)
                assert.include(error.message, "not found")
            })

            test("updateMemoArchiveStatus", async () => {
                let memo = await assertOkResult(
                    memoStorage.getMemo(ctx, createdMemosIDs[5]),
                )

                vi.useFakeTimers()
                vi.setSystemTime(addHours(memo.updatedAt, 1))
                await assertOkResult(
                    memoStorage.updateMemoArchiveStatus(ctx, {
                        id: memo.id,
                        isArchived: true,
                    }),
                )
                vi.useRealTimers()

                let updated = await assertOkResult(
                    memoStorage.getMemo(ctx, memo.id),
                )

                assert.isTrue(updated.isArchived)
                assert.isTrue(isAfter(updated.updatedAt, memo.updatedAt))

                vi.useFakeTimers()
                vi.setSystemTime(addHours(memo.updatedAt, 1))
                await assertOkResult(
                    memoStorage.updateMemoArchiveStatus(ctx, {
                        id: memo.id,
                        isArchived: false,
                    }),
                )
                vi.useRealTimers()

                let noLongerArchived = await assertOkResult(
                    memoStorage.getMemo(ctx, memo.id),
                )

                assert.isFalse(noLongerArchived.isArchived)
                assert.isTrue(
                    isAfter(noLongerArchived.updatedAt, memo.updatedAt),
                )
            })

            test("updateMemoArchiveStatus/Not Found", async () => {
                let error = await assertErrResult(
                    memoStorage.updateMemoArchiveStatus(ctx, {
                        id: "INVALID_ID",
                        isArchived: true,
                    }),
                )
                assert.isDefined(error)
                assert.include(error.message, "not found")
            })

            test("deleteMemo", async () => {
                let created = await assertOkResult(
                    memoStorage.createMemo(ctx, {
                        content: "Memo To Be Deleted",
                    }),
                )

                let now = new Date()
                vi.useFakeTimers()
                vi.setSystemTime(addHours(now, 1))
                await assertOkResult(memoStorage.deleteMemo(ctx, created.id))
                vi.useRealTimers()

                let deleted = await assertOkResult(
                    memoStorage.getMemo(ctx, created.id),
                )

                assert.isTrue(deleted.isDeleted)
                assert.isTrue(isAfter(deleted.updatedAt, created.updatedAt))

                vi.useFakeTimers()
                vi.setSystemTime(addDays(now, 40))
                await assertOkResult(memoStorage.cleanupDeletedMemos(ctx))
                vi.useRealTimers()

                let error = await assertErrResult(
                    memoStorage.getMemo(ctx, created.id),
                )
                assert.isDefined(error)
                assert.include(error?.message, "not found")
            })

            test("undeleteMemo", async () => {
                let memo = await assertOkResult(
                    memoStorage.getMemo(ctx, createdMemosIDs[8]),
                )

                vi.useFakeTimers()
                vi.setSystemTime(addHours(memo.updatedAt, 1))
                await assertOkResult(memoStorage.deleteMemo(ctx, memo.id))
                vi.useRealTimers()

                let deleted = await assertOkResult(
                    memoStorage.getMemo(ctx, memo.id),
                )

                assert.isTrue(deleted.isDeleted)
                assert.isTrue(isAfter(deleted.updatedAt, memo.updatedAt))

                await assertOkResult(memoStorage.undeleteMemo(ctx, memo.id))

                let undeleted = await assertOkResult(
                    memoStorage.getMemo(ctx, memo.id),
                )

                assert.isFalse(undeleted.isDeleted)
                assert.isTrue(isAfter(deleted.updatedAt, memo.updatedAt))
            })

            test("deleteMemo/Not Found", async () => {
                let error = await assertErrResult(
                    memoStorage.deleteMemo(ctx, "INVALID_ID"),
                )
                assert.isDefined(error)
                assert.include(error?.message, "not found")
            })
        },
        30000,
    )

    suite.sequential("Tags", () => {
        let [ctx, cancel] = BaseContext.withData("db", undefined).withCancel()
        let db = new SQLite()
        let memoStorage = new MemoStorage({
            db,
            repo: memoRepo,
            attachments: new AttachmentStorage({
                db,
                repo: attachmentRepo,
            } as any),
            changelog: new ChangelogStorage({
                sourceName: "tests",
                db,
                repo: changelogRepo,
            }),
        })

        let numMemos = 10
        let createdMemosIDs: MemoID[] = []

        beforeEach(async () => {
            createdMemosIDs = []
            await db.open()

            let now = new Date()

            for (let i = 0; i < numMemos; i++) {
                let res = await memoStorage.createMemo(ctx, {
                    content: `# Test Memo ${i}\n With some more content for memo ${i} #tag-${i} #shared-tag`,
                    createdAt: now,
                })

                if (!res.ok) {
                    throw res.err
                }
                createdMemosIDs.push(res.value.id)
            }
        })

        afterEach(async () => {
            cancel()
            await db.close()
        })

        test("Tags for newly created Memos exist", async () => {
            let tags = await assertOkResult(
                memoStorage.listTags(ctx, {
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

        test("Tag count doesn't change after Memo update if no tags were added or removed", async () => {
            for (let i = 0; i < numMemos; i++) {
                await assertOkResult(
                    memoStorage.updateMemoContent(ctx, {
                        id: createdMemosIDs[i],
                        content: `# Test Memo ${i}\n Updated content for memo ${i} #tag-${i} #shared-tag`,
                        changes: {
                            version: "1",
                            changes: [
                                [
                                    0,
                                    `# Test Memo ${i}\n Updated content for memo ${i} #tag-${i} #shared-tag`,
                                ],
                            ],
                        },
                    }),
                )
            }

            let tags = await assertOkResult(
                memoStorage.listTags(ctx, {
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

        test("Tags are removed when count reaches 0", async () => {
            // Update Memos, removing unique tags tags
            for (let i = 0; i < numMemos; i++) {
                await memoStorage.updateMemoContent(ctx, {
                    id: createdMemosIDs[i],
                    content: `# Test Memo ${i}\n Updated content for memo ${i} #shared-tag`,
                    changes: {
                        version: "1",
                        changes: [
                            [
                                0,
                                `# Test Memo ${i}\n Updated content for memo ${i} #shared-tag`,
                            ],
                        ],
                    },
                })
            }

            let tags = await assertOkResult(
                memoStorage.listTags(ctx, {
                    pagination: { pageSize: numMemos * 2 },
                }),
            )

            assert.equal(tags.items.length, 1)

            assert.equal(tags.items[0].count, numMemos)
        })

        test("Tag count is reduced when Memos are deleted", async () => {
            let expectedDeletedTags: string[] = []
            for (let i = 0; i < numMemos / 2; i++) {
                expectedDeletedTags.push(`tag-${i}`)
                await assertOkResult(
                    memoStorage.deleteMemo(ctx, createdMemosIDs[i]),
                )
            }

            let tags = await assertOkResult(
                memoStorage.listTags(ctx, {
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

    suite.sequential("Attachments", async () => {
        let [ctx, cancel] = BaseContext.withData("db", undefined).withCancel()

        let db = new SQLite()
        let fs = new MockFS()

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

        beforeAll(async () => {
            await db.open()
        })

        afterAll(async () => {
            cancel()
            await db.close()
        })

        test("Attachments", async () => {
            let attachmentContent = encodeText("# Attachment Test")
            let buf = new SharedArrayBuffer(attachmentContent.byteLength)
            new Uint8Array(buf).set(attachmentContent, 0)

            let attachmentID = await assertOkResult(
                attachmentStorage.createAttachment(ctx, {
                    filename: "file_a.txt",
                    content: buf,
                }),
            )

            let content = `# Test Memo to Check Changelog\nMemo content here.\n[text for attachment link](attachment://${attachmentID})`
            let created = await assertOkResult(
                memoStorage.createMemo(ctx, {
                    content,
                    createdAt: new Date(),
                }),
            )
            assert.isDefined(created)

            let attachmentsForMemo = await assertOkResult(
                attachmentStorage.listAttachmentsForMemo(ctx, created.id),
            )
            assert.equal(attachmentsForMemo.length, 1)

            attachmentContent = encodeText("# Other Attachment Content")
            buf = new SharedArrayBuffer(attachmentContent.byteLength)
            new Uint8Array(buf).set(attachmentContent, 0)

            let attachmentID2 = await assertOkResult(
                attachmentStorage.createAttachment(ctx, {
                    filename: "file_b.txt",
                    content: buf,
                }),
            )

            content = `# Test Memo to Check Changelog\nMemo content here.\n[text for file_b](attachment://${attachmentID2})`
            await assertOkResult(
                memoStorage.updateMemoContent(ctx, {
                    id: created.id,
                    content,
                    changes: {
                        version: "1",
                        changes: [[0, content]],
                    },
                }),
            )
        })
    })

    suite("applyChangelogEntry", async () => {
        let [ctx, cancel] = BaseContext.withData("db", undefined).withCancel()
        let { memoStorage, ...setup } = await memoStorageTestSetup()

        let now = new Date(2024, 2, 15, 12, 0, 0, 0)
        let numMemos = 10

        let createdMemosIDs: MemoID[] = []

        beforeAll(async () => {
            await setup.beforeAll()

            for (let i = 0; i < numMemos; i++) {
                let res = await memoStorage.createMemo(ctx, {
                    content: `# Test Memo ${i}\n With some more content for memo ${i}`,
                    createdAt: subHours(now, i),
                })
                if (!res.ok) {
                    throw res.err
                }
                createdMemosIDs.push(res.value.id)
            }
        })

        afterAll(async () => {
            cancel()
            await setup.afterAll()
        })

        test("applyChangelogEntry", async () => {
            let changeset: MemoContentChanges["changes"] = [
                48,
                [0, "", "", "A new line for Memo 0."],
            ]

            await assertOkResult(
                memoStorage.applyChangelogEntry(ctx, {
                    id: newID(),
                    source: "tests",
                    revision: 1,
                    targetType: "memos",
                    targetID: createdMemosIDs[0],
                    isSynced: false,
                    isApplied: false,
                    timestamp: new Date(),
                    value: {
                        content: {
                            version: "1",
                            changes: changeset,
                        },
                    },
                }),
            )

            let updated = await assertOkResult(
                memoStorage.getMemo(ctx, createdMemosIDs[0]),
            )

            assert.equal(
                updated.content,
                "# Test Memo 0\n With some more content for memo 0\n\nA new line for Memo 0.",
            )
        })
    })
})

async function memoStorageTestSetup(): Promise<{
    memoStorage: MemoStorage
    beforeAll: () => Promise<void>
    afterAll: () => Promise<void>
}> {
    let db = new SQLite()
    let fs = new MockFS()

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

    return {
        memoStorage: new MemoStorage({
            db,
            repo: memoRepo,
            attachments: attachmentStorage,
            changelog,
        }),
        beforeAll: async () => {
            await db.open()
        },
        afterAll: async () => {
            await db.close()
        },
    }
}
