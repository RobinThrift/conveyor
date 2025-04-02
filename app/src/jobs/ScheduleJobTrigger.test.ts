import { afterEach, beforeEach, suite, test, vi } from "vitest"

import { Ok } from "@/lib/result"

import { Second } from "@/lib/duration"
import { ScheduleJobTrigger } from "./ScheduleJobTrigger"

suite.sequential("jobs/ScheduleJobTrigger", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })
    afterEach(() => {
        vi.restoreAllMocks()
    })

    test("ScheduleJobTrigger", async ({ expect, onTestFinished }) => {
        let spy = vi.fn(() => {})
        let run = Promise.withResolvers<void>()

        let trigger = new ScheduleJobTrigger(10 * Second)

        trigger.registerJob({
            name: "test-job",
            run: async () => {
                spy()
                run.resolve()
                return Ok(undefined)
            },
        })

        trigger.start()
        onTestFinished(() => trigger.stop())

        vi.advanceTimersByTime(1 * Second)

        expect(spy).to.not.toHaveBeenCalled()

        vi.advanceTimersByTime(10 * Second)

        await run.promise

        expect(spy).to.toHaveBeenCalledOnce()

        vi.advanceTimersByTime(12 * Second)

        expect(spy).to.toHaveBeenCalledTimes(2)
    })
})
