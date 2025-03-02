import type { Attachment } from "@/domain/Attachment"
import type { Notification } from "@/ui/notifications"
import { createNanoEvents } from "nanoevents"

export interface Events {
    "notifications:add": (evt: Notification) => void
    [key: `vim:write:${string}`]: () => void
    [key: `vim:quit:${string}`]: () => void
    "attachments:upload:start": (evt: {
        taskID: string
        filename: string
        data: ReadableStream<Uint8Array>
    }) => void
    "attachments:upload:done": (evt: {
        taskID: string
        attachment?: Attachment
    }) => void
    "attachments:upload:error": (evt: {
        taskID: string
        error: Error
    }) => void
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
