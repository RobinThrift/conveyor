import { assert, afterAll, suite, test } from "vitest"

import { BaseContext } from "@/lib/context"

import { assertErrResult, assertOkResult } from "../testhelper/assertions"
import { TestWorker } from "./__test__/worker.internal"

suite("lib/worker", () => {
    let [ctx, cancel] = BaseContext.withCancel()

    afterAll(() => cancel())

    test("createWorker", async () => {
        let client = TestWorker.createClient(
            new Worker(
                new URL(
                    "./__test__/worker.internal?worker&url",
                    import.meta.url,
                ),
                {
                    type: "module",
                    name: "TestWorker",
                },
            ),
            ctx.signal,
        )

        client.addEventListener("error", (evt) => {
            if ("data" in evt) {
                assert.fail(evt.data.error.message)
            }
        })

        let res = await assertOkResult(
            client.concat(ctx, { strArg: "foo", numArg: 120 }),
        )

        assert.equal(res, "foo.120")

        await assertErrResult(
            client.errResult(ctx, {
                foo: "bar",
            }),
        )
    })
})
