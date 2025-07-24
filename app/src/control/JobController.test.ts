import { afterEach, beforeEach, suite, test, vi } from "vitest"

import type { SyncJob } from "@/jobs/SyncJob"
import { Second } from "@/lib/duration"
import { Ok } from "@/lib/result"

import { JobController } from "./JobController"

suite("control/JobController", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })
    afterEach(() => {
        vi.restoreAllMocks()
    })

    test("scheduleJob", async ({ expect, onTestFinished }) => {
        let spy = vi.fn(() => {})
        let run = Promise.withResolvers<void>()

        let ctrl = new JobController()

        ctrl.registerJob("sync", {
            run: async () => {
                spy()
                run.resolve()
                return Ok(undefined)
            },
        } as unknown as SyncJob)

        ctrl.scheduleJob("sync", 10 * Second)

        onTestFinished(() => ctrl.stop())

        vi.advanceTimersByTime(1 * Second)

        expect(spy).to.not.toHaveBeenCalled()

        vi.advanceTimersByTime(10 * Second)

        await run.promise

        expect(spy).to.toHaveBeenCalledOnce()

        vi.advanceTimersByTime(12 * Second)

        expect(spy).to.toHaveBeenCalledTimes(2)
    })

    test("triggerJobOnEvent", async ({ expect, onTestFinished }) => {
        let spy = vi.fn(() => {})
        let run = Promise.withResolvers<void>()

        let ctrl = new JobController()

        ctrl.registerJob("sync", {
            run: async () => {
                spy()
                run.resolve()
                return Ok(undefined)
            },
        } as unknown as SyncJob)

        ctrl.triggerJobOnEvent("sync", window, "message")

        onTestFinished(() => ctrl.stop())

        window.dispatchEvent(new MessageEvent("message"))

        await run.promise

        expect(spy).to.toHaveBeenCalledOnce()
    })
})
