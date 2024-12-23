import type { Notification } from "@/notifications"
import { UnauthorizedError } from "@/storage/remote/apiv1/APIError"
import { isAnyOf } from "@reduxjs/toolkit"

import type { StartListening } from "./rootStore"

import { slice as apiTokens } from "./apitokens"
import { slice as memoList } from "./memolist"
import { slice as memos } from "./memos"
import { slice as notifications } from "./notifications"
import { slice as tags } from "./tags"

export const registerEffects = (startListening: StartListening) => {
    startListening({
        matcher: isAnyOf(
            memoList.actions.setError,
            memos.actions.setError,
            apiTokens.actions.setError,
            tags.actions.setError,
        ),
        effect: async (
            { payload }: { payload: any },
            { dispatch, getState },
        ) => {
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

            if (error instanceof UnauthorizedError) {
                let state = getState()
                buttons = [
                    {
                        children: "Login",
                        ariaLabel: "Login",
                        onClick: () => {
                            window.location.href = `${window.location.protocol}//${window.location.host}${state.router.baseURL}`
                        },
                    },
                ]
            }

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
