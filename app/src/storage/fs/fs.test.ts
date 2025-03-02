import { assert, suite, test } from "vitest"

import { BaseContext } from "@/lib/context"
import { MockFS } from "@/lib/testhelper/mockfs"
import { decodeText, encodeText } from "@/lib/textencoding"

import { readAttachment, removeAttachment, writeAttachment } from "./fs"

suite("storage/fs", () => {
    suite.sequential("read/write", async () => {
        let fs = new MockFS()

        let content = `# Attachment Test
This is some test content for an attachment`

        test("write", async () => {
            let encoded = encodeText(content)

            let buf = new SharedArrayBuffer(encoded.byteLength)
            new Uint8Array(buf).set(encoded, 0)

            let writeResult = await writeAttachment(BaseContext, fs, buf)
            if (!writeResult.ok) {
                assert.fail(
                    `${writeResult.err.message}: ${writeResult.err.stack}`,
                )
            }
        })

        test("read", async () => {
            let readResult = await readAttachment(
                BaseContext,
                fs,
                "/01/5b/6f/31/a4/ad/c7/48/df/45/17/9d/ec/38/b0/e4/af/60/4d/c4/15/8e/51/88/9d/11/de/9e/2d/df/a2/3c",
            )
            if (!readResult.ok) {
                assert.fail(
                    `${readResult.err.message}: ${readResult.err.stack}`,
                )
            }

            let readCopy = new Uint8Array(
                new ArrayBuffer(readResult.value.byteLength),
            )
            readCopy.set(new Uint8Array(readResult.value), 0)

            let readbackContent = decodeText(readCopy)

            assert.equal(readbackContent, content)
        })

        test("remove", async () => {
            let removeResult = await removeAttachment(
                BaseContext,
                fs,
                "/01/5b/6f/31/a4/ad/c7/48/df/45/17/9d/ec/38/b0/e4/af/60/4d/c4/15/8e/51/88/9d/11/de/9e/2d/df/a2/3c",
            )
            if (!removeResult.ok) {
                assert.fail(
                    `${removeResult.err.message}: ${removeResult.err.stack}`,
                )
            }

            let readResult = await readAttachment(
                BaseContext,
                fs,
                "/01/5b/6f/31/a4/ad/c7/48/df/45/17/9d/ec/38/b0/e4/af/60/4d/c4/15/8e/51/88/9d/11/de/9e/2d/df/a2/3c",
            )
            assert.isFalse(readResult.ok)
        })
    })
})
