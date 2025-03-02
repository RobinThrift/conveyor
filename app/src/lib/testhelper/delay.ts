import type { Duration } from "@/lib/duration"

export function delay(delay: Duration): Promise<void> {
    let { resolve, promise } = Promise.withResolvers<void>()

    setTimeout(resolve, delay)

    return promise
}
