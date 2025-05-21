import { assert, afterAll, suite, test } from "vitest"

import { AgeCrypto } from "@/external/age/AgeCrypto"
import { BaseContext } from "@/lib/context"
import { MockFS } from "@/lib/testhelper/mockfs"
import { decodeText, encodeText } from "@/lib/textencoding"

import { toPromise } from "../result"
import { EncryptedFS } from "./EncryptedFS"

suite("lib/fs/EncryptedFS", () => {
    suite("read/write", { timeout: 1000 }, async () => {
        let [ctx, cancel] = BaseContext.withCancel()

        let mockfs = new MockFS()
        let crypto = new AgeCrypto()
        await crypto.init(await toPromise(crypto.generatePrivateKey()))
        let fs = new EncryptedFS(mockfs, crypto)

        afterAll(() => {
            cancel()
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
