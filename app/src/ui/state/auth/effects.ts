import type { AuthController } from "@/control/AuthController"
import { BaseContext } from "@/lib/context"
import type { StartListening } from "@/ui/state/rootStore"

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
        actionCreator: slice.actions.getInitialToken,
        effect: async (
            { payload },
            { cancelActiveListeners, getState, dispatch, signal },
        ) => {
            if (slice.selectors.isLoading(getState())) {
                return
            }

            cancelActiveListeners()

            dispatch(slice.actions.setAuthStatus({ isLoading: true }))

            let token = await authCtrl.getInitialToken(
                BaseContext.withSignal(signal),
                payload,
            )

            if (!token.ok) {
                dispatch(
                    slice.actions.setAuthStatus({
                        isLoading: false,
                        error: token.err,
                    }),
                )
                return
            }

            dispatch(slice.actions.setAuthStatus({ isLoading: false }))
        },
    })

    startListening({
        actionCreator: slice.actions.changePassword,
        effect: async (
            { payload },
            { cancelActiveListeners, getState, dispatch, signal },
        ) => {
            if (slice.selectors.isLoading(getState())) {
                return
            }

            cancelActiveListeners()

            dispatch(slice.actions.setAuthStatus({ isLoading: true }))

            let changed = await authCtrl.changePassword(
                BaseContext.withSignal(signal),
                payload,
            )

            if (!changed.ok) {
                dispatch(
                    slice.actions.setAuthStatus({
                        isLoading: false,
                        error: changed.err,
                    }),
                )
                return
            }

            dispatch(slice.actions.setAuthStatus({ isLoading: false }))
        },
    })
}
