import type { Notification } from "@/ui/notifications"
import { createNanoEvents } from "nanoevents"

export interface Events {
    "notifications:add": (evt: Notification) => void
    [key: `vim:write:${string}`]: () => void
    [key: `vim:quit:${string}`]: () => void
}

const EventBus = createNanoEvents<Events>()

export function on<K extends keyof Events>(event: K, callback: Events[K]) {
    return EventBus.on(event, callback)
}

export function emit<K extends keyof Events>(
    event: K,
    ...args: Parameters<Events[K]>
) {
    return EventBus.emit(event, ...(args as any))
}

export function once<K extends keyof Events>(event: K, callback: Events[K]) {
    let unsub = EventBus.on(event, (...args: any[]) => {
        unsub()
        callback(args[0])
    })

    return unsub
}
