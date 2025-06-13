import { http, HttpResponse } from "msw"
import { setupWorker } from "msw/browser"
import { assert, suite, test } from "vitest"

import { BaseContext } from "@/lib/context"
import { assertOkResult } from "@/lib/testhelper/assertions"

import { AgeV1AccountKeyType, PrimaryAccountKeyName } from "@/domain/AccountKey"
import { dataFromBase64 } from "@/lib/base64"
import { Ok } from "@/lib/result"
import { decodeText, encodeText } from "@/lib/textencoding"
import { AccountKeysV1APIClient } from "./AccountKeysV1APIClient"

suite("api/syncv1/AccountKeysV1APIClient", async () => {
    test("uploadAccountKey", async ({ onTestFinished }) => {
        let { ctx, setup, cleanup, useMocks, authV1APIClient } =
            await setupAuthV1APIClientTest()

        await setup()
        onTestFinished(cleanup)

        let accountKey =
            "age1py392mrpw6tv0rm2gvcz5lwugmnw3j05nzqgs0w9thnq6qeu3pns9mryhf"

        useMocks(
            http.post<never, { name: string; type: "agev1"; data: string }>(
                "/api/auth/v1/keys",
                async ({ request }) => {
                    let body = await request.json()
                    assert.equal(body.name, PrimaryAccountKeyName)
                    assert.equal(body.type, AgeV1AccountKeyType)
                    assert.equal(
                        decodeText(dataFromBase64(body.data)[0]),
                        accountKey,
                    )

                    return new HttpResponse(null, { status: 201 })
                },
            ),
        )

        await assertOkResult(
            authV1APIClient.uploadAccountKey(ctx, {
                name: PrimaryAccountKeyName,
                type: AgeV1AccountKeyType,
                data: encodeText(accountKey).buffer as ArrayBuffer,
            }),
        )
    })
})

async function setupAuthV1APIClientTest() {
    let [ctx, cancel] = BaseContext.withCancel()

    let authV1APIClient = new AccountKeysV1APIClient({
        baseURL: globalThis.location.href,
        tokenStorage: { getToken: () => Promise.resolve(Ok("TOKEN")) },
    })

    let mockWorker = setupWorker()

    return {
        ctx,
        setup: async () => {
            await mockWorker.start({
                quiet: true,
            })
        },
        cleanup: async () => {
            cancel()
            mockWorker.stop()
        },
        useMocks: ((...args) =>
            mockWorker.use(...args)) as typeof mockWorker.use,
        authV1APIClient,
    }
}
