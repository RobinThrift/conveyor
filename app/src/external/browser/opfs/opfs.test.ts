import { assert, afterAll, suite, test } from "vitest"

import { BaseContext } from "@/lib/context"
import { decodeText, encodeText } from "@/lib/textencoding"

import { OPFS } from "./opfs"

suite("external/browser/opfs", () => {
    suite("read/write", async () => {
        let [ctx, cancel] = BaseContext.withCancel()

        let fs = new OPFS("attachments")

        afterAll(() => {
            cancel()
            fs.terminate()
        })

        let content = `# Attachment Test
This is some test content for an attachment`

        test("write", async () => {
            let encoded = encodeText(content)

            let buf = new ArrayBuffer(encoded.byteLength)
            new Uint8Array(buf).set(encoded, 0)

            let writeResult = await fs.write(ctx, "file.txt", buf)
            if (!writeResult.ok) {
                assert.fail(
                    `${writeResult.err.message}: ${writeResult.err.stack}`,
                )
            }
        })

        test("read", async () => {
            let readResult = await fs.read(ctx, "file.txt")
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

        test("simultaneous read", async () => {
            let readResults = await Promise.all([
                fs.read(ctx, "file.txt"),
                fs.read(ctx, "file.txt"),
            ])

            for (let readResult of readResults) {
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
            }
        })

        test("remove", async () => {
            let removeResult = await fs.remove(ctx, "file.txt")
            if (!removeResult.ok) {
                assert.fail(
                    `${removeResult.err.message}: ${removeResult.err.stack}`,
                )
            }

            let readResult = await fs.read(ctx, "file.txt")
            assert.isFalse(readResult.ok)
        })
    })
})
