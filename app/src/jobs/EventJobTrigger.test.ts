import { suite, test, vi } from "vitest"

import { Ok } from "@/lib/result"

import { EventJobTrigger } from "./EventJobTrigger"

suite("jobs/EventJobTrigger", () => {
    test("EventJobTrigger", async ({ expect, onTestFinished }) => {
        let spy = vi.fn(() => {})
        let run = Promise.withResolvers<void>()

        let trigger = new EventJobTrigger(window, "message")

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

        window.dispatchEvent(new MessageEvent("message"))

        await run.promise

        expect(spy).to.toHaveBeenCalledOnce()
    })
})
