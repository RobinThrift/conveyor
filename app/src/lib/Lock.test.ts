import { afterEach, assert, beforeEach, suite, test, vi } from "vitest"

import { BaseContext } from "@/lib/context"
import { Ok } from "@/lib/result"
import { assertErrResult, assertOkResult } from "@/lib/testhelper/assertions"

import { Lock } from "./Lock"

suite("lib/Lock", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })
    afterEach(() => {
        vi.restoreAllMocks()
    })

    test("single consumer", async ({ onTestFinished }) => {
        let [ctx, cancel] = BaseContext.withCancel()
        onTestFinished(() => cancel())

        let { promise, resolve } = Promise.withResolvers<number>()
        let lock = new Lock("test_single_consumer")

        let returned = lock.run(ctx, async () => {
            resolve(10)
            return Ok(10)
        })

        let valFromPromise = await promise
        let valFromReturn = await assertOkResult(returned)

        assert.equal(valFromPromise, valFromReturn)
    })

    test("multiple consumers", async ({ onTestFinished }) => {
        let [ctx, cancel] = BaseContext.withCancel()
        onTestFinished(() => cancel())

        let lock = new Lock("test_multi_consumer")
        let ready = Promise.withResolvers<void>()

        let value = 1

        let section1 = lock.run(ctx, async () => {
            await ready.promise
            value = 10
            return Ok(value)
        })

        vi.advanceTimersToNextTimer()

        let section2 = lock.run(ctx, async () => {
            await ready.promise
            value *= 20
            return Ok(value)
        })

        ready.resolve()

        let section1Result = await assertOkResult(section1)
        let section2Result = await assertOkResult(section2)

        assert.equal(section1Result, 10)
        assert.equal(section2Result, 200)
        assert.equal(value, 200)
    })

    test("cancelled context before", async ({ expect }) => {
        let [ctx, cancel] = BaseContext.withCancel()
        cancel(new Error("test cancellation before run"))

        let spy = vi.fn(() => {})

        let lock = new Lock("test_cancelled_context_before")
        let err = await assertErrResult(
            lock.run(ctx, async () => {
                spy()
                return Ok(undefined)
            }),
        )

        assert.equal(err.message, "test cancellation before run")
        expect(spy).to.not.toHaveBeenCalled()
    })

    test("cancelled context during", async ({ expect }) => {
        let [ctx, cancel] = BaseContext.withCancel()

        let ready = Promise.withResolvers<void>()
        let isRunning = Promise.withResolvers<void>()

        let spy = vi.fn(() => {})

        let lock = new Lock("test_cancelled_context_during")
        let section = lock.run(ctx, async () => {
            isRunning.resolve()
            await ready.promise
            spy()
            return Ok(undefined)
        })

        vi.advanceTimersToNextTimer()

        await isRunning.promise

        cancel(new Error("test cancellation during run"))

        ready.resolve()

        let err = await assertErrResult(section)

        assert.equal(err.message, "test cancellation during run")
        expect(spy).to.toHaveBeenCalled()
    })

    test("runIfAvailable", async ({ expect, onTestFinished }) => {
        let [ctx, cancel] = BaseContext.withCancel()
        onTestFinished(() => cancel())

        let lock = new Lock("test_runIfAvailable")
        let isRunning = Promise.withResolvers<void>()
        let block = Promise.withResolvers<void>()
        let spy = vi.fn(async () => {
            return Ok(200)
        })

        let section1 = lock.run(ctx, async () => {
            isRunning.resolve()
            await block.promise
            return Ok(100)
        })

        vi.advanceTimersToNextTimer()

        await isRunning.promise

        let section2 = lock.runIfAvailable(ctx, spy)

        vi.advanceTimersToNextTimer()

        block.resolve()

        let section1Result = await assertOkResult(section1)
        let section2Result = await assertOkResult(section2)

        expect(spy).to.not.toHaveBeenCalled()
        assert.equal(section1Result, 100)
        assert.isUndefined(section2Result)
    })
})
