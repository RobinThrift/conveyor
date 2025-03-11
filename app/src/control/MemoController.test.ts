import { addDays, addHours, isAfter, subHours, transpose } from "date-fns"
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
import { newID } from "@/domain/ID"
import type { MemoID, MemoList } from "@/domain/Memo"
import { WebCryptoSha256Hasher } from "@/external/browser/crypto/WebCryptoSha256Hasher"
import { BaseContext } from "@/lib/context"
import { assertErrResult, assertOkResult } from "@/lib/testhelper/assertions"
import { MockFS } from "@/lib/testhelper/mockfs"
import { SQLite } from "@/lib/testhelper/sqlite"
import { encodeText } from "@/lib/textencoding"
import { AttachmentRepo } from "@/storage/database/sqlite/AttachmentRepo"
import { ChangelogRepo } from "@/storage/database/sqlite/ChangelogRepo"
import { MemoRepo } from "@/storage/database/sqlite/MemoRepo"
import { UTCDateMini } from "@date-fns/utc"

import { AttachmentController } from "./AttachmentController"
import { ChangelogController } from "./ChangelogController"
import { MemoController } from "./MemoController"

suite("control/MemoController", () => {
    suite.sequential("Querying", async () => {
        let { memoCtrl, ctx, setup, cleanup } = await memoCtrlTestSetup()

        let now = transpose(new Date(2024, 2, 15, 12, 0, 0, 0), UTCDateMini)
        let numMemos = 500

        let createdMemosIDs: MemoID[] = []

        beforeAll(async () => {
            await setup()

            for (let i = 0; i < numMemos * 1.5; i++) {
                let res = await memoCtrl.createMemo(ctx, {
                    content: `# Test Memo ${i}\n With some more content for memo ${i}\n #tag-${i}d #parent/tag-${i + 1} #mod-two-is-${i % 2}`,
                    createdAt: subHours(now, i),
                })
                if (!res.ok) {
                    throw res.err
                }
                createdMemosIDs.push(res.value.id)
            }

            for (let i = numMemos; i < numMemos * 1.25; i++) {
                let res = await memoCtrl.updateMemoArchiveStatus(ctx, {
                    id: createdMemosIDs[i],
                    isArchived: true,
                })
                if (!res.ok) {
                    throw res.err
                }
            }

            for (let i = numMemos * 1.25; i < numMemos * 1.5; i++) {
                let res = await memoCtrl.deleteMemo(ctx, createdMemosIDs[i])
                if (!res.ok) {
                    throw res.err
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
                    filter: { exactDate: now },
                    pagination: { pageSize: numMemos },
                }),
            )

            assert.equal(list.items.length, 13)
        })

        test("Filter by startDate", async () => {
            let startDate = subHours(now, 24)
            let list = await assertOkResult(
                memoCtrl.listMemos(ctx, {
                    filter: { startDate },
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
            let startDate = subHours(now, 24)
            let list = await assertOkResult(
                memoCtrl.listMemos(ctx, {
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

    suite.concurrent(
        "CRUD",
        async () => {
            let { memoCtrl, changelogCtrl, ctx, setup, cleanup } =
                await memoCtrlTestSetup()

            let now = new Date(2024, 2, 15, 12, 0, 0, 0)
            let numMemos = 10
            let createdMemosIDs: MemoID[] = []

            beforeAll(async () => {
                await setup()

                for (let i = 0; i < numMemos; i++) {
                    let res = await memoCtrl.createMemo(ctx, {
                        content: `# Test Memo ${i}\n With some more content for memo ${i}`,
                        createdAt: subHours(now, i),
                    })
                    if (!res.ok) {
                        throw res.err
                    }
                    createdMemosIDs.push(res.value.id)
                }
            })

            afterAll(cleanup)

            test("createMemo/changelog", async () => {
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

            test("getMemo", async () => {
                let result = await assertOkResult(
                    memoCtrl.getMemo(ctx, createdMemosIDs[1]),
                )
                assert.isDefined(result)
            })

            test("getMemo/Not Found", async () => {
                let error = await assertErrResult(
                    memoCtrl.getMemo(ctx, "INVALID_ID"),
                )
                assert.isDefined(error)
                assert.include(error.message, "not found")
            })

            test("updateMemo", async () => {
                let memo = await assertOkResult(
                    memoCtrl.getMemo(ctx, createdMemosIDs[2]),
                )
                memo.content = "Updated Content for Memo 2"

                vi.useFakeTimers()
                vi.setSystemTime(addHours(memo.updatedAt, 1))
                await assertOkResult(
                    memoCtrl.updateMemoContent(ctx, {
                        ...memo,
                        changes: {
                            version: "1",
                            changes: [[0, "Updated Content for Memo 2"]],
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

            test("updateMemo/Not Found", async () => {
                let error = await assertErrResult(
                    memoCtrl.updateMemoContent(ctx, {
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
                    memoCtrl.getMemo(ctx, createdMemosIDs[5]),
                )

                vi.useFakeTimers()
                vi.setSystemTime(addHours(memo.updatedAt, 1))
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
                assert.isTrue(isAfter(updated.updatedAt, memo.updatedAt))

                vi.useFakeTimers()
                vi.setSystemTime(addHours(memo.updatedAt, 1))
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

            test("updateMemoArchiveStatus/Not Found", async () => {
                let error = await assertErrResult(
                    memoCtrl.updateMemoArchiveStatus(ctx, {
                        id: "INVALID_ID",
                        isArchived: true,
                    }),
                )
                assert.isDefined(error)
                assert.include(error.message, "not found")
            })

            test("deleteMemo", async () => {
                let created = await assertOkResult(
                    memoCtrl.createMemo(ctx, {
                        content: "Memo To Be Deleted",
                    }),
                )

                let now = new Date()
                vi.useFakeTimers()
                vi.setSystemTime(addHours(now, 1))
                await assertOkResult(memoCtrl.deleteMemo(ctx, created.id))
                vi.useRealTimers()

                let deleted = await assertOkResult(
                    memoCtrl.getMemo(ctx, created.id),
                )

                assert.isTrue(deleted.isDeleted)
                assert.isTrue(isAfter(deleted.updatedAt, created.updatedAt))

                vi.useFakeTimers()
                vi.setSystemTime(addDays(now, 40))
                await assertOkResult(memoCtrl.cleanupDeletedMemos(ctx))
                vi.useRealTimers()

                let error = await assertErrResult(
                    memoCtrl.getMemo(ctx, created.id),
                )
                assert.isDefined(error)
                assert.include(error?.message, "not found")
            })

            test("undeleteMemo", async () => {
                let memo = await assertOkResult(
                    memoCtrl.getMemo(ctx, createdMemosIDs[8]),
                )

                vi.useFakeTimers()
                vi.setSystemTime(addHours(memo.updatedAt, 1))
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

            test("deleteMemo/Not Found", async () => {
                let error = await assertErrResult(
                    memoCtrl.deleteMemo(ctx, "INVALID_ID"),
                )
                assert.isDefined(error)
                assert.include(error?.message, "not found")
            })
        },
        30000,
    )

    suite.sequential("Tags", async () => {
        let { memoCtrl, ctx, setup, cleanup } = await memoCtrlTestSetup()

        let numMemos = 10
        let createdMemosIDs: MemoID[] = []

        beforeEach(async () => {
            await setup()
            createdMemosIDs = []

            let now = new Date()

            for (let i = 0; i < numMemos; i++) {
                let res = await memoCtrl.createMemo(ctx, {
                    content: `# Test Memo ${i}\n With some more content for memo ${i} #tag-${i} #shared-tag`,
                    createdAt: now,
                })

                if (!res.ok) {
                    throw res.err
                }
                createdMemosIDs.push(res.value.id)
            }
        })

        afterEach(cleanup)

        test("Tags for newly created Memos exist", async () => {
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

        test("Tag count doesn't change after Memo update if no tags were added or removed", async () => {
            for (let i = 0; i < numMemos; i++) {
                await assertOkResult(
                    memoCtrl.updateMemoContent(ctx, {
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

        test("Tags are removed when count reaches 0", async () => {
            // Update Memos, removing unique tags tags
            for (let i = 0; i < numMemos; i++) {
                await memoCtrl.updateMemoContent(ctx, {
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
                memoCtrl.listTags(ctx, {
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

    suite.sequential("Attachments", async () => {
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
                        changes: [[0, content]],
                    },
                }),
            )
        })
    })

    suite.concurrent("applyChangelogEntry", async () => {
        let { memoCtrl, ctx, setup, cleanup } = await memoCtrlTestSetup()

        let now = new Date(2024, 2, 15, 12, 0, 0, 0)
        let numMemos = 10

        let createdMemosIDs: MemoID[] = []

        beforeAll(async () => {
            await setup()

            for (let i = 0; i < numMemos; i++) {
                let res = await memoCtrl.createMemo(ctx, {
                    content: `# Test Memo ${i}\n With some more content for memo ${i}`,
                    createdAt: subHours(now, i),
                })
                if (!res.ok) {
                    throw res.err
                }
                createdMemosIDs.push(res.value.id)
            }
        })

        afterAll(cleanup)

        test("exisitng Memo", async () => {
            let changeset: MemoContentChanges["changes"] = [
                48,
                [0, "", "", "A new line for Memo 0."],
            ]

            await assertOkResult(
                memoCtrl.applyChangelogEntry(ctx, {
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
                memoCtrl.getMemo(ctx, createdMemosIDs[0]),
            )

            assert.equal(
                updated.content,
                "# Test Memo 0\n With some more content for memo 0\n\nA new line for Memo 0.",
            )
        })

        test("new Memo", async () => {
            let newMemoID = newID()
            await assertOkResult(
                memoCtrl.applyChangelogEntry(ctx, {
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
                            createdAt: now,
                            updatedAt: now,
                        },
                    },
                }),
            )

            let created = await assertOkResult(memoCtrl.getMemo(ctx, newMemoID))

            assert.equal(created.content, "# Memo 1\nCreated using a changelog")
        })
    })
})

async function memoCtrlTestSetup() {
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

    return {
        ctx,
        memoCtrl,
        changelogCtrl,
        attachmentCtrl,
        setup: async () => {
            await db.open(ctx)
        },
        cleanup: async () => {
            cancel()
            await db.close()
        },
    }
}
