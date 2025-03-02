import { assert, afterAll, suite, test } from "vitest"

import { BaseContext } from "@/lib/context"
import { createKeyFromPassword } from "@/lib/crypto"
import { toPromise } from "@/lib/result"
import { MockFS } from "@/lib/testhelper/mockfs"
import { decodeText, encodeText } from "@/lib/textencoding"

import { EncrypedFS } from "./encryptedfs"

suite("lib/fs/encryptedfs", () => {
    suite.sequential("read/write", { timeout: 1000 }, async () => {
        let [ctx, cancel] = BaseContext.withCancel()

        let mockfs = new MockFS()
        let fs = new EncrypedFS(
            mockfs,
            await toPromise(createKeyFromPassword("lib/fs/encryptedfs")),
        )

        afterAll(() => {
            cancel()
            fs.terminate()
        })

        let content = `# Attachment Test
This is some test content for an attachment`

        test("write", async () => {
            let encoded = encodeText(content)

            let buf = new SharedArrayBuffer(encoded.byteLength)
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
