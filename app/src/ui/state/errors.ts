import type { Notification } from "@/ui//notifications"
import { isAnyOf } from "@reduxjs/toolkit"

import type { StartListening } from "./rootStore"

import { slice as notifications } from "./global/notifications"
import * as memos from "./memos"

export const registerEffects = (startListening: StartListening) => {
    startListening({
        matcher: isAnyOf(memos.actions.setError),
        effect: async ({ payload }: { payload: any }, { dispatch }) => {
            let error: Error
            if ("error" in payload) {
                error = payload.error
            } else {
                return
            }

            if (typeof error === "string" && error === "listener-cancelled") {
                return
            }

            let buttons: Notification["buttons"] | undefined = undefined

            let [title, message] = error.message.split(/:\n/, 2)
            dispatch(
                notifications.actions.add({
                    notification: {
                        type: "error",
                        title,
                        message,
                        buttons,
                    },
                }),
            )
        },
    })
}
