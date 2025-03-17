import { assert, suite, test } from "vitest"

import type { AttachmentChangelogEntry } from "@/domain/Changelog"
import { newID } from "@/domain/ID"
import { WebCryptoSha256Hasher } from "@/external/browser/crypto/WebCryptoSha256Hasher"
import { dataFromBase64 } from "@/lib/base64"
import { BaseContext, type Context } from "@/lib/context"
import { type AsyncResult, Err, Ok } from "@/lib/result"
import { assertErrResult, assertOkResult } from "@/lib/testhelper/assertions"
import { MockFS } from "@/lib/testhelper/mockfs"
import { SQLite } from "@/lib/testhelper/sqlite"
import { encodeText } from "@/lib/textencoding"
import { AttachmentRepo } from "@/storage/database/sqlite/AttachmentRepo"
import { ChangelogRepo } from "@/storage/database/sqlite/ChangelogRepo"

import { AttachmentController } from "./AttachmentController"
import { ChangelogController } from "./ChangelogController"

const attachmentTestContent = Object.freeze({
    "test_file_a.txt": (() => {
        let encoded = encodeText("test_file_a.txt content")
        let buf = new ArrayBuffer(encoded.byteLength)
        new Uint8Array(buf).set(encoded, 0)
        return buf
    })(),
    "test_file_b.txt": (() => {
        let encoded = encodeText("test_file_b.txt content")
        let buf = new ArrayBuffer(encoded.byteLength)
        new Uint8Array(buf).set(encoded, 0)
        return buf
    })(),
})

suite.concurrent.only("control/AttachmentController", () => {
    test("read/write", async ({ onTestFinished }) => {
        let { attachmentCtrl, changelogCtrl, ctx, setup, cleanup } =
            await attachmentCtrlTestSetup()

        await setup()
        onTestFinished(cleanup)
        let created = await assertOkResult(
            attachmentCtrl.createAttachment(ctx, {
                filename: "test.txt",
                content: attachmentTestContent["test_file_a.txt"],
            }),
        )

        let changes = await assertOkResult(
            changelogCtrl.listUnsyncedChangelogEntries(ctx, {
                pagination: { pageSize: 1 },
            }),
        )

        assert.equal(changes.items.length, 1)

        let entry = changes.items[0] as AttachmentChangelogEntry
        assert.equal(entry.source, "tests")
        assert.equal(entry.revision, 1)
        assert.equal(entry.targetType, "attachments")
        assert.equal(entry.targetID, created)
        assert.deepEqual(entry.value, {
            created: {
                contentType: "application/octet-stream",
                filepath:
                    "/42/b7/b6/55/29/e5/7d/b5/50/54/ae/81/79/dc/bc/34/d4/93/47/6d/33/c9/25/87/dd/72/a3/b4/69/df/b8/4b",
                originalFilename: "test.txt",
                sha256: "Qre2VSnlfbVQVK6Bedy8NNSTR20zySWH3XKjtGnfuEs=",
                sizeBytes: 23,
            },
        })
        assert.isFalse(entry.isSynced)
        assert.isTrue(entry.isApplied)
    })

    suite.concurrent("Remote Fallback", async () => {
        test("found", async ({ onTestFinished }) => {
            let { attachmentCtrl, fs, ctx, setup, cleanup } =
                await attachmentCtrlTestSetup({
                    remote: {
                        async getAttachmentDataByFilepath(_, filepath) {
                            if (
                                filepath ===
                                "/42/b7/b6/55/29/e5/7d/b5/50/54/ae/81/79/dc/bc/34/d4/93/47/6d/33/c9/25/87/dd/72/a3/b4/69/df/b8/4b"
                            ) {
                                return Ok(
                                    attachmentTestContent["test_file_a.txt"],
                                )
                            }
                            return Err(new Error("not found"))
                        },
                    },
                })

            await setup()
            onTestFinished(cleanup)

            let attachmentID = await assertOkResult(
                attachmentCtrl.createAttachment(ctx, {
                    filename: "file_a.txt",
                    content: attachmentTestContent["test_file_a.txt"],
                }),
            )

            fs.removeAllFiles()

            let { attachment, data } = await assertOkResult(
                attachmentCtrl.getAttachmentDataByID(ctx, attachmentID),
            )
            assert.isDefined(attachment)
            assert.isDefined(data)
            assert.equal(data, attachmentTestContent["test_file_a.txt"])
        })

        test("not found", async ({ onTestFinished }) => {
            let { attachmentCtrl, fs, ctx, setup, cleanup } =
                await attachmentCtrlTestSetup({
                    remote: {
                        async getAttachmentDataByFilepath() {
                            return Err(new Error("not found"))
                        },
                    },
                })

            await setup()
            onTestFinished(cleanup)

            let attachmentID = await assertOkResult(
                attachmentCtrl.createAttachment(ctx, {
                    filename: "file_b.txt",
                    content: attachmentTestContent["test_file_b.txt"],
                }),
            )

            fs.removeAllFiles()

            await assertErrResult(
                attachmentCtrl.getAttachmentDataByID(ctx, attachmentID),
            )
        })
    })

    test("applyChangelogEntry", async ({ onTestFinished }) => {
        let { attachmentCtrl, ctx, setup, cleanup, attachmentRepo } =
            await attachmentCtrlTestSetup()

        await setup()
        onTestFinished(cleanup)

        let id = newID()

        await assertOkResult(
            attachmentCtrl.applyChangelogEntries(ctx, [
                {
                    id: newID(),
                    source: "tests",
                    revision: 1,
                    targetType: "attachments",
                    targetID: id,
                    isSynced: false,
                    isApplied: false,
                    timestamp: new Date(),
                    value: {
                        created: {
                            contentType: "application/octet-stream",
                            filepath:
                                "/42/b7/b6/55/29/e5/7d/b5/50/54/ae/81/79/dc/bc/34/d4/93/47/6d/33/c9/25/87/dd/72/a3/b4/69/df/b8/4b",
                            originalFilename: "test.txt",
                            sha256: "Qre2VSnlfbVQVK6Bedy8NNSTR20zySWH3XKjtGnfuEs=",
                            sizeBytes: 23,
                        },
                    },
                },
            ]),
        )

        let row = await assertOkResult(attachmentRepo.getAttachment(ctx, id))

        assert.deepEqual(row, {
            id,
            contentType: "application/octet-stream",
            filepath:
                "/42/b7/b6/55/29/e5/7d/b5/50/54/ae/81/79/dc/bc/34/d4/93/47/6d/33/c9/25/87/dd/72/a3/b4/69/df/b8/4b",
            originalFilename: "test.txt",
            sha256: dataFromBase64(
                "Qre2VSnlfbVQVK6Bedy8NNSTR20zySWH3XKjtGnfuEs=",
            ),
            sizeBytes: 23,
            createdAt: row.createdAt,
        })
    })
})

async function attachmentCtrlTestSetup({
    remote,
}: {
    remote?: {
        getAttachmentDataByFilepath(
            ctx: Context,
            filepath: string,
        ): AsyncResult<ArrayBufferLike>
    }
} = {}) {
    let [ctx, cancel] = BaseContext.withCancel()

    let fs = new MockFS()
    let db = new SQLite()

    let changelogCtrl = new ChangelogController({
        sourceName: "tests",
        transactioner: db,
        repo: new ChangelogRepo(db),
    })

    let attachmentRepo = new AttachmentRepo(db)

    let attachmentCtrl = new AttachmentController({
        transactioner: db,
        repo: attachmentRepo,
        fs,
        hasher: new WebCryptoSha256Hasher(),
        changelog: changelogCtrl,
        remote,
    })

    return {
        attachmentCtrl,
        changelogCtrl,
        attachmentRepo,
        fs,
        ctx,
        setup: () => db.open(ctx),
        cleanup: async () => {
            cancel()
            await db.close()
        },
    }
}
