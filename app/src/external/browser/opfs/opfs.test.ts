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

            let [_, err] = await fs.write(ctx, "file.txt", buf)
            if (err) {
                assert.fail(`${err.message}: ${err.stack}`)
            }
        })

        test("read", async () => {
            let [readData, readErr] = await fs.read(ctx, "file.txt")
            if (readErr) {
                assert.fail(`${readErr.message}: ${readErr.stack}`)
            }

            let readCopy = new Uint8Array(new ArrayBuffer(readData.byteLength))
            readCopy.set(new Uint8Array(readData), 0)

            let readbackContent = decodeText(readCopy)

            assert.equal(readbackContent, content)
        })

        test("simultaneous read", async () => {
            let readResults = await Promise.all([
                fs.read(ctx, "file.txt"),
                fs.read(ctx, "file.txt"),
            ])

            for (let [data, err] of readResults) {
                if (err) {
                    assert.fail(`$err.message}: ${err.stack}`)
                }

                let readCopy = new Uint8Array(new ArrayBuffer(data.byteLength))
                readCopy.set(new Uint8Array(data), 0)

                let readbackContent = decodeText(readCopy)

                assert.equal(readbackContent, content)
            }
        })

        test("remove", async () => {
            let [_, err] = await fs.remove(ctx, "file.txt")
            if (err) {
                assert.fail(`${err.message}: $err.stack}`)
            }

            let [_read, readErr] = await fs.read(ctx, "file.txt")
            assert.instanceOf(readErr, Error)
        })
    })
})
