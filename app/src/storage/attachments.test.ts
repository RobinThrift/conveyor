import { assert, afterAll, suite, test } from "vitest"

import type { AttachmentChangelogEntry } from "@/domain/Changelog"
import { BaseContext } from "@/lib/context"
import { assertErrResult, assertOkResult } from "@/lib/testhelper/assertions"
import { MockFS } from "@/lib/testhelper/mockfs"
import { SQLite } from "@/lib/testhelper/sqlite"
import { encodeText } from "@/lib/textencoding"
import { Err, Ok } from "@/lib/result"

import { AttachmentStorage, extractAttachmentIDs } from "./attachments"
import { ChangelogStorage } from "./changelog"
import * as attachmentRepo from "./database/sqlite/attachmentRepo"
import * as changelogRepo from "./database/sqlite/changelogRepo"

const attachmentTestContent = Object.freeze({
    "test_file_a.txt": (() => {
        let encoded = encodeText("test_file_a.txt content")
        let buf = new SharedArrayBuffer(encoded.byteLength)
        new Uint8Array(buf).set(encoded, 0)
        return buf
    })(),
    "test_file_b.txt": (() => {
        let encoded = encodeText("test_file_b.txt content")
        let buf = new SharedArrayBuffer(encoded.byteLength)
        new Uint8Array(buf).set(encoded, 0)
        return buf
    })(),
})

suite.concurrent("storage/attachments", () => {
    suite.sequential("read/write", async () => {
        let [ctx, cancel] = BaseContext.withData("db", undefined).withCancel()

        let fs = new MockFS()
        let db = new SQLite()
        await db.open()
        afterAll(async () => {
            cancel()
            await db.close()
        })

        let changelog = new ChangelogStorage({
            sourceName: "tests",
            db,
            repo: changelogRepo,
        })

        let storage = new AttachmentStorage({
            db,
            repo: attachmentRepo,
            fs,
            changelog,
        })

        test("createAttachment", async () => {
            let created = await assertOkResult(
                storage.createAttachment(ctx, {
                    filename: "test.txt",
                    content: attachmentTestContent["test_file_a.txt"],
                }),
            )

            let changes = await assertOkResult(
                changelog.listUnsyncedChangelogEntries(ctx, {
                    pagination: { pageSize: 1 },
                }),
            )

            assert.equal(changes.items.length, 1)

            let entry = changes.items[0] as AttachmentChangelogEntry
            assert.equal(entry.source, "tests")
            assert.equal(entry.revision, 1)
            assert.equal(entry.targetType, "attachments")
            assert.equal(entry.targetID, created)
            assert.equal(entry.value.method, "created")
            assert.isFalse(entry.synced)
            assert.isTrue(entry.applied)
        })
    })

    suite.concurrent("Remote Fallback", async () => {
        let [ctx, cancel] = BaseContext.withData("db", undefined).withCancel()

        let fs = new MockFS()
        let db = new SQLite()
        await db.open()
        afterAll(async () => {
            cancel()
            await db.close()
        })

        let changelog = new ChangelogStorage({
            sourceName: "tests",
            db,
            repo: changelogRepo,
        })

        let storage = new AttachmentStorage({
            db,
            repo: attachmentRepo,
            fs,
            changelog,
            remote: {
                async getAttachmentDataByFilepath(_, filepath) {
                    if (
                        filepath ===
                        "/42/b7/b6/55/29/e5/7d/b5/50/54/ae/81/79/dc/bc/34/d4/93/47/6d/33/c9/25/87/dd/72/a3/b4/69/df/b8/4b"
                    ) {
                        return Ok(attachmentTestContent["test_file_a.txt"])
                    }
                    return Err(new Error("not found"))
                },
            },
        })

        let [attachmentIDFound, attachmentIDNotFound] = await Promise.all([
            assertOkResult(
                storage.createAttachment(ctx, {
                    filename: "file_a.txt",
                    content: attachmentTestContent["test_file_a.txt"],
                }),
            ),
            assertOkResult(
                storage.createAttachment(ctx, {
                    filename: "file_b.txt",
                    content: attachmentTestContent["test_file_b.txt"],
                }),
            ),
        ])

        fs.removeAllFiles()

        test("found", async () => {
            let { attachment, data } = await assertOkResult(
                storage.getAttachmentDataByID(ctx, attachmentIDFound),
            )
            assert.isDefined(attachment)
            assert.isDefined(data)
            assert.equal(data, attachmentTestContent["test_file_a.txt"])
        })

        test("not found", async () => {
            await assertErrResult(
                storage.getAttachmentDataByID(ctx, attachmentIDNotFound),
            )
        })
    })

    test.concurrent.each([
        [
            "No Attachments",
            {
                input: `# Memo with no Attachments
This just some test content.`,
                expected: [],
            },
        ],
        [
            "Plain URL",
            {
                input: `# Memo with Plain URL
Memo with a plain URL: attachment://hT6XtCfBjyAukyiLqP9Th
`,
                expected: [],
            },
        ],
        [
            "Single Image",
            {
                input: `# Memo with Single Image
![Alt for img_a](attachment://KOg6Le_xr5wyYMHoru2kK?thumbhash=IAiCAYAniIaIh48AAAAAAJioh4eAhyc=)
`,
                expected: ["KOg6Le_xr5wyYMHoru2kK"],
            },
        ],
        [
            "Two Images",
            {
                input: `# Memo with Two Images
![Alt for img_a](attachment://KOg6Le_xr5wyYMHoru2kK?thumbhash=IAiCAYAniIaIh48AAAAAAJioh4eAhyc=)
Some mor test
![Alt for img_b](attachment://NNGFChDai3n7chWlKQ3wC?thumbhash=Hs2BAYAniZqKeH8fbWLX9pioh4eAhyc=)
`,
                expected: ["KOg6Le_xr5wyYMHoru2kK", "NNGFChDai3n7chWlKQ3wC"],
            },
        ],
        [
            "Single File",
            {
                input: `# Memo with a Signle File
Some text referencing: 
[text for filename_a](attachment://oxfMwRLYYvXV6bCPeogm7)
`,
                expected: ["oxfMwRLYYvXV6bCPeogm7"],
            },
        ],
        [
            "Two Files",
            {
                input: `# Memo with a Two Files
Some text referencing:
[text for filename_a](attachment://oxfMwRLYYvXV6bCPeogm7)
And some more prose with regards to [filename_b](attachment://EdckfatXNS7KYKQwa8R2X)
`,
                expected: ["oxfMwRLYYvXV6bCPeogm7", "EdckfatXNS7KYKQwa8R2X"],
            },
        ],
        [
            "Image and File mixed",
            {
                input: `# Memo with Images and Files
Some text referencing:
[text for filename_a](attachment://oxfMwRLYYvXV6bCPeogm7)

Please see the attached image: ![Alt for img_a](attachment://KOg6Le_xr5wyYMHoru2kK?thumbhash=IAiCAYAniIaIh48AAAAAAJioh4eAhyc=)

And some more prose with regards to [filename_b](attachment://EdckfatXNS7KYKQwa8R2X)
`,
                expected: [
                    "oxfMwRLYYvXV6bCPeogm7",
                    "KOg6Le_xr5wyYMHoru2kK",
                    "EdckfatXNS7KYKQwa8R2X",
                ],
            },
        ],
    ])("%s", (_, { input, expected }) => {
        let actual = extractAttachmentIDs(input)
        assert.deepEqual(actual, expected)
    })
})
