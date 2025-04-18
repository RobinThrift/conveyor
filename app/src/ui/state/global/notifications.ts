import { type PayloadAction, createSlice } from "@reduxjs/toolkit"
import { useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { Notification } from "@/ui/notifications"

export interface NotificationsState {
    notifications: Notification[]
}

const initialState: NotificationsState = {
    notifications: [],
}

export const slice = createSlice({
    name: "notifications",
    reducerPath: "global.notifications",
    initialState,
    reducers: {
        add: (
            state,
            {
                payload,
            }: PayloadAction<{
                notification: Notification
            }>,
        ) => {
            state.notifications = [...state.notifications, payload.notification]
        },
        remove: (state, { payload }: PayloadAction<{ index: number }>) => {
            let notifications = [...state.notifications]
            notifications.splice(payload.index, 1)

            return {
                ...state,
                notifications,
            }
        },
    },

    selectors: {
        notifications: (state) => state.notifications,
    },
})

export function useNotifications() {
    let notifications = useSelector(slice.selectors.notifications)
    let dispatch = useDispatch()
    let remove = useCallback(
        (index: number) => dispatch(slice.actions.remove({ index })),
        [dispatch],
    )
    return {
        notifications,
        remove,
    }
}

export function useNotificationDispatcher() {
    let dispatch = useDispatch()
    return useCallback(
        (notification: Notification) =>
            dispatch(slice.actions.add({ notification })),
        [dispatch],
    )
}
