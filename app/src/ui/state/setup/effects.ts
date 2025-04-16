import type { NavigationController } from "@/control/NavigationController"
import type { SetupController } from "@/control/SetupController"
import { BUILD_INFO } from "@/domain/BuildInfo"
import { BaseContext } from "@/lib/context"
import type { StartListening } from "@/ui/state/rootStore"

import * as auth from "../auth"
import * as settings from "../settings"
import * as sync from "../sync"
import { slice } from "./slice"

export const registerEffects = (
    startListening: StartListening,
    {
        setupCtrl,
        navCtrl,
    }: {
        setupCtrl: SetupController
        navCtrl: NavigationController
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
        actionCreator: slice.actions.setupCandidatePrivateCryptoKey,
        effect: async (_, { dispatch }) => {
            dispatch(auth.actions.reset())
            dispatch(sync.actions.reset())
        },
    })

    startListening({
        actionCreator: slice.actions.setIsSetup,
        effect: async ({ payload }, { cancelActiveListeners, signal }) => {
            cancelActiveListeners()
            if (payload.isSetup) {
                setupCtrl.saveSetupInfo(BaseContext.withSignal(signal), {
                    isSetup: true,
                    setupAt: new Date(),
                    version: BUILD_INFO.version,
                })
            } else {
                setupCtrl.saveSetupInfo(BaseContext.withSignal(signal), {
                    isSetup: false,
                })
            }
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
            let state = getState()
            if (slice.selectors.isSetup(state)) {
                return
            }

            let step = slice.selectors.step(state)
            if (step === "sync-error" || step === "remote-error") {
                dispatch(slice.actions.next())
                return
            }

            if (step !== "sync") {
                return
            }

            cancelActiveListeners()

            if (payload.status === "error") {
                dispatch(
                    slice.actions.setStep({
                        step: "sync-error",
                        error: payload.error,
                    }),
                )
                return
            }

            if (payload.status === "ready") {
                dispatch(slice.actions.next())
            }
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

            dispatch(settings.actions.loadStart())
            dispatch(sync.actions.loadSyncInfo())

            navCtrl.push({
                screen: {
                    name: "root",
                    params: {},
                },
                restore: {},
            })
        },
    })
}
