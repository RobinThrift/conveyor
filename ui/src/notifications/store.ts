import { atom } from "nanostores"
import type { Notification } from "./types"

export const $notificationStore = atom<Notification[]>([])

export function add(n: Notification) {
    $notificationStore.set([...$notificationStore.get(), n])
}

export function remove(i: number) {
    let next = [...$notificationStore.get()]
    next.splice(i, 1)
    $notificationStore.set(next)
}
