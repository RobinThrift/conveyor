import { assert, suite, test } from "vitest"

import { BaseContext } from "./context"
import { Second } from "./duration"
import { delay } from "./testhelper/delay"

suite("lib/context", () => {
    test("withCancel", () => {
        let parentCtx = BaseContext

        let [childCtx, cancel] = parentCtx.withCancel()
        cancel()

        assert.isTrue(childCtx.isCancelled())
        assert.isFalse(parentCtx.isCancelled())
    })

    test("withTimeout", async () => {
        let parentCtx = BaseContext

        let [childCtx] = parentCtx.withTimeout(0)
        await delay(Second)

        assert.isTrue(childCtx.isCancelled())
        assert.isFalse(parentCtx.isCancelled())
    })

    test("withTimeout manual cancel", async () => {
        let parentCtx = BaseContext

        let [childCtx, cancel] = parentCtx.withTimeout(Second * 60)
        assert.isFalse(childCtx.signal?.aborted)
        cancel()

        assert.isTrue(childCtx.isCancelled())
        assert.isFalse(parentCtx.isCancelled())
    })
})
