import type { AuthController } from "@/control/AuthController"
import { BaseContext } from "@/lib/context"
import type { StartListening } from "@/ui/state/rootStore"

import { PasswordChangeRequiredError } from "@/auth"
import { slice } from "./slice"

export const registerEffects = (
    startListening: StartListening,
    {
        authCtrl,
    }: {
        authCtrl: AuthController
    },
) => {
    startListening({
        actionCreator: slice.actions.authenticate,
        effect: async (
            { payload },
            { cancelActiveListeners, getState, dispatch, signal },
        ) => {
            let status = slice.selectors.status(getState())
            if (status === "authenticating") {
                return
            }

            cancelActiveListeners()

            dispatch(
                slice.actions.setAuthStatus({
                    status: "authenticating",
                }),
            )

            authCtrl.setOrigin(payload.server)
            let token = await authCtrl.getInitialToken(
                BaseContext.withSignal(signal),
                payload,
            )

            if (!token.ok && token.err instanceof PasswordChangeRequiredError) {
                dispatch(
                    slice.actions.setAuthStatus({
                        error: token.err,
                        status: "password-change-required",
                    }),
                )
            }

            if (!token.ok) {
                dispatch(
                    slice.actions.setAuthStatus({
                        error: token.err,
                        status: "error",
                    }),
                )
                return
            }

            dispatch(
                slice.actions.setAuthStatus({
                    status: "authenticated",
                }),
            )
        },
    })

    startListening({
        actionCreator: slice.actions.changePassword,
        effect: async (
            { payload },
            { cancelActiveListeners, getState, dispatch, signal },
        ) => {
            let status = slice.selectors.status(getState())
            if (
                status === "password-change-in-progress" ||
                status === "authenticating"
            ) {
                return
            }

            cancelActiveListeners()

            dispatch(
                slice.actions.setAuthStatus({
                    status: "password-change-in-progress",
                }),
            )

            let changed = await authCtrl.changePassword(
                BaseContext.withSignal(signal),
                payload,
            )

            if (!changed.ok) {
                dispatch(
                    slice.actions.setAuthStatus({
                        error: changed.err,
                        status: "password-change-error",
                    }),
                )
                return
            }

            dispatch(
                slice.actions.setAuthStatus({
                    status: "not-authenticated",
                }),
            )
        },
    })
}
