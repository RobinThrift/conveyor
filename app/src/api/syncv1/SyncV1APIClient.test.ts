import { HttpResponse, http } from "msw"
import { assert, suite } from "vitest"

import { BaseContext } from "@/lib/context"
import { Ok } from "@/lib/result"
import { assertOkResult } from "@/lib/testhelper/assertions"
import { test } from "@/lib/testhelper/test"
import { decodeText, encodeText } from "@/lib/textencoding"

import { SyncV1APIClient } from "./SyncV1APIClient"

suite("api/syncv1/SyncV1APIClient", async () => {
    test("getFullSync", async ({ onTestFinished, worker }) => {
        let { ctx, cleanup, syncV1APIClient } = await setupSyncV1APIClientTest()
        onTestFinished(cleanup)

        let content = "THIS IS TOTALLY A DATABASE"
        let data = encodeText(content)

        worker.use(
            http.get("/api/sync/v1/full", () => {
                return new HttpResponse(new Uint8Array(data), {
                    status: 200,
                })
            }),
        )

        let fetched = await assertOkResult(syncV1APIClient.getFullSync(ctx))
        assert.equal(decodeText(new Uint8Array(fetched)), content)
    })

    test("uploadFullDB", async ({ onTestFinished, worker }) => {
        let { ctx, cleanup, syncV1APIClient } = await setupSyncV1APIClientTest()
        onTestFinished(cleanup)

        let content = "THIS IS TOTALLY A DATABASE"
        let data = encodeText(content)

        worker.use(
            http.post("/api/sync/v1/full", async ({ request }) => {
                assert.equal(decodeText(new Uint8Array(await request.arrayBuffer())), content)
                return new HttpResponse(null, {
                    status: 201,
                })
            }),
        )

        await assertOkResult(syncV1APIClient.uploadFullSyncData(ctx, data.buffer))
    })

    test("uploadAttachment", async ({ onTestFinished, worker }) => {
        let { ctx, cleanup, syncV1APIClient } = await setupSyncV1APIClientTest()
        onTestFinished(cleanup)

        let content = "THIS IS TOTALLY A DATABASE"
        let data = encodeText(content)

        worker.use(
            http.post("/api/sync/v1/attachments", async ({ request }) => {
                assert.equal(
                    decodeText(
                        // biome-ignore lint/style/noNonNullAssertion: just a atest
                        await decompressData(request.body!),
                    ),
                    content,
                )
                return new HttpResponse(null, {
                    status: 201,
                })
            }),
        )

        await assertOkResult(
            syncV1APIClient.uploadAttachment(ctx, {
                filepath: "/a/b/c/d/e/f",
                data: data,
            }),
        )
    })
})

async function setupSyncV1APIClientTest() {
    let [ctx, cancel] = BaseContext.withCancel()

    let syncV1APIClient = new SyncV1APIClient({
        baseURL: globalThis.location.href,
        tokenStorage: { getToken: () => Promise.resolve(Ok("TOKEN")) },
    })

    return {
        ctx,
        cleanup: async () => {
            cancel()
        },
        syncV1APIClient,
    }
}

async function decompressData(stream: ReadableStream<Uint8Array<ArrayBufferLike>>) {
    let { readable, writable } = new TransformStream()
    stream.pipeThrough(new DecompressionStream("gzip")).pipeTo(writable)

    let reader = readable.getReader()

    let chunks: BlobPart[] = []

    let blob = await reader.read().then(async function read({
        done,
        value,
    }: ReadableStreamReadResult<Uint8Array>): Promise<Blob> {
        if (done) {
            return new Blob(chunks)
        }

        chunks.push(value)

        return reader.read().then(read)
    })

    return new Uint8Array(await blob.arrayBuffer())
}
