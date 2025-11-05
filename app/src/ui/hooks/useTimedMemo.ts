import { type DependencyList, useEffect, useState } from "react"

import { currentDateTime } from "@/lib/i18n"

export type Interval = "day" | "time"

export function useTimedMemo<T>(
    factory: () => T,
    interval: Interval,
    deps: DependencyList = [],
): T {
    let [value, setValue] = useState(factory)

    // biome-ignore lint/correctness/useExhaustiveDependencies: the factory function must be stable
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | undefined

        let scheduleNext = () => {
            let current = currentDateTime()
            let nextWakeup = current
            if (interval === "day") {
                nextWakeup = nextWakeup
                    .add({ days: 1 })
                    .round({ smallestUnit: "day", roundingMode: "floor" })
            }

            clearTimeout(timeout)
            timeout = setTimeout(() => {
                let next = factory()
                if (next !== value) {
                    setValue(next)
                    return
                }

                scheduleNext()
            }, nextWakeup.epochMilliseconds - current.epochMilliseconds)
        }

        scheduleNext()

        return () => clearTimeout(timeout)
    }, [...deps, interval, value])

    return value
}
