import type { AuthController } from "@/control/AuthController"
import { BaseContext } from "@/lib/context"
import type { StartListening } from "@/ui/state/rootStore"

import { PasswordChangeRequiredError } from "@/auth"
import { isErr } from "@/lib/errors"
import { fromThrowing } from "@/lib/result"
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
        effect: async ({ payload }, { cancelActiveListeners, getState, dispatch, signal }) => {
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

            let [serverURL, err] = fromThrowing(() => new URL(payload.server))
            if (err) {
                dispatch(
                    slice.actions.setAuthStatus({
                        error: err,
                        status: "error",
                    }),
                )
                return
            }

            authCtrl.setOrigin(serverURL.host)
            let [_, getInitialTokenErr] = await authCtrl.getInitialToken(
                BaseContext.withSignal(signal),
                payload,
            )

            if (isErr(getInitialTokenErr, PasswordChangeRequiredError)) {
                dispatch(
                    slice.actions.setAuthStatus({
                        error: getInitialTokenErr,
                        status: "password-change-required",
                    }),
                )
            }

            if (getInitialTokenErr) {
                dispatch(
                    slice.actions.setAuthStatus({
                        error: getInitialTokenErr,
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
        effect: async ({ payload }, { cancelActiveListeners, getState, dispatch, signal }) => {
            let status = slice.selectors.status(getState())
            if (status === "password-change-in-progress" || status === "authenticating") {
                return
            }

            cancelActiveListeners()

            dispatch(
                slice.actions.setAuthStatus({
                    status: "password-change-in-progress",
                }),
            )

            let [_, err] = await authCtrl.changePassword(BaseContext.withSignal(signal), payload)

            if (err) {
                dispatch(
                    slice.actions.setAuthStatus({
                        error: err,
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

    startListening({
        actionCreator: slice.actions.reset,
        effect: async (_action, { cancelActiveListeners, signal }) => {
            cancelActiveListeners()

            let [_, err] = await authCtrl.reset(BaseContext.withSignal(signal))
            if (err) {
                console.error(err)
                return
            }
        },
    })
}
