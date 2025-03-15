import type { SetupController } from "@/control/SetupController"
import { BaseContext } from "@/lib/context"
import type { StartListening } from "@/ui/state/rootStore"

import * as auth from "../auth"
import { slice as router } from "../global/router"
import * as sync from "../sync"
import { slice } from "./slice"

export const registerEffects = (
    startListening: StartListening,
    {
        setupCtrl,
    }: {
        setupCtrl: SetupController
    },
) => {
    startListening({
        actionCreator: slice.actions.loadSetupInfo,
        effect: async (
            _,
            { cancelActiveListeners, getState, dispatch, signal },
        ) => {
            if (slice.selectors.isSetup(getState())) {
                return
            }

            cancelActiveListeners()

            let loaded = await setupCtrl.loadSetupInfo(
                BaseContext.withSignal(signal),
            )
            if (!loaded.ok) {
                dispatch(
                    slice.actions.setStep({
                        step: "load-error",
                        error: loaded.err,
                    }),
                )
                return
            }

            if (loaded.value?.isSetup) {
                dispatch(
                    slice.actions.setIsSetup({
                        isSetup: loaded.value?.isSetup ?? false,
                    }),
                )
                return
            }

            dispatch(
                slice.actions.setStep({
                    step: "initial-setup",
                }),
            )
        },
    })

    startListening({
        predicate(_, currentState) {
            return (
                slice.selectors.step(currentState) === "start-sync" &&
                !slice.selectors.isSetup(currentState)
            )
        },
        effect: async (_, { cancelActiveListeners, dispatch }) => {
            cancelActiveListeners()

            dispatch(
                slice.actions.setStep({
                    step: "sync",
                }),
            )

            dispatch(sync.actions.syncStartDownloadFull())
        },
    })

    startListening({
        actionCreator: sync.actions.setStatus,
        effect: async (
            { payload },
            { cancelActiveListeners, dispatch, getState },
        ) => {
            if (slice.selectors.isSetup(getState())) {
                return
            }

            if (payload.status !== "error") {
                return
            }

            cancelActiveListeners()

            dispatch(
                slice.actions.setStep({
                    step: "sync-error",
                    error: payload.error,
                }),
            )
        },
    })

    startListening({
        actionCreator: auth.actions.setAuthStatus,
        effect: async (
            { payload },
            { cancelActiveListeners, dispatch, getState },
        ) => {
            if (slice.selectors.isSetup(getState())) {
                return
            }

            if (payload.status !== "error") {
                return
            }

            cancelActiveListeners()

            dispatch(
                slice.actions.setStep({
                    step: "remote-error",
                    error: payload.error,
                }),
            )
        },
    })

    startListening({
        predicate(_, currentState) {
            return (
                slice.selectors.step(currentState) === "done" &&
                !slice.selectors.isSetup(currentState)
            )
        },
        effect: async (_, { cancelActiveListeners, dispatch }) => {
            cancelActiveListeners()

            dispatch(
                slice.actions.setIsSetup({
                    isSetup: true,
                }),
            )

            dispatch(router.actions.goto({ path: "/" }))
        },
    })
}
