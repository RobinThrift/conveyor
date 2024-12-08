import { useStore } from "@nanostores/react"
import { useCallback } from "react"
import { $notificationStore, add, remove } from "./store"
import type { Notification } from "./types"

export * from "./types"

export function useNotificationStore() {
    let notifications = useStore($notificationStore)
    return {
        notifications,
        remove,
    }
}

export function useNotificationDispatcher() {
    return useCallback((n: Notification) => add(n), [])
}
