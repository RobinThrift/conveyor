import type { AuthController } from "@/control/AuthController"
import type { SyncController } from "@/control/SyncController"
import { BaseContext } from "@/lib/context"
import { randomID } from "@/lib/randomID"
import type { StartListening } from "@/ui/state/rootStore"

import * as auth from "../auth"
import { slice } from "./slice"

export const registerEffects = (
    startListening: StartListening,
    {
        syncCtrl,
        authCtrl,
    }: {
        syncCtrl: SyncController
        authCtrl: AuthController
    },
) => {
    startListening({
        actionCreator: slice.actions.setup,
        effect: async (
            { payload },
            { cancelActiveListeners, getState, dispatch, signal },
        ) => {
            let status = slice.selectors.status(getState())
            if (status !== "disabled" && status !== "error") {
                return
            }

            cancelActiveListeners()

            dispatch(slice.actions.setStatus({ status: "setting-up" }))
            dispatch(
                auth.actions.setAuthStatus({
                    isLoading: true,
                }),
            )

            let ctx = BaseContext.withSignal(signal)

            authCtrl.setOrigin(payload.serverAddr)

            let authed = await authCtrl.getInitialToken(ctx, {
                username: payload.username,
                password: payload.password,
            })

            if (!authed.ok) {
                dispatch(
                    slice.actions.setStatus({
                        status: "error",
                        error: authed.err,
                    }),
                )
                dispatch(
                    auth.actions.setAuthStatus({
                        isLoading: false,
                        error: authed.err,
                    }),
                )
                return
            }

            let clientID = randomID()

            syncCtrl.init(ctx, {
                server: payload.serverAddr,
                username: payload.username,
                clientID,
            })

            dispatch(slice.actions.setStatus({ status: "ready" }))
            dispatch(
                slice.actions.setSyncInfo({
                    isEnabled: true,
                    clientID,
                    server: payload.serverAddr,
                    username: payload.username,
                }),
            )
            dispatch(
                auth.actions.setAuthStatus({
                    isLoading: false,
                }),
            )
        },
    })

    startListening({
        actionCreator: slice.actions.loadSyncInfo,
        effect: async (
            _,
            { cancelActiveListeners, getState, dispatch, signal },
        ) => {
            let status = slice.selectors.status(getState())
            if (status === "disabled") {
                return
            }

            cancelActiveListeners()

            let loaded = await syncCtrl.load(BaseContext.withSignal(signal))

            if (!loaded.ok) {
                dispatch(
                    slice.actions.setStatus({
                        status: "error",
                        error: loaded.err,
                    }),
                )
                return
            }

            if (loaded.value?.isEnabled) {
                dispatch(
                    slice.actions.setSyncInfo({
                        ...loaded.value,
                    }),
                )
            }
        },
    })

    startListening({
        actionCreator: slice.actions.syncStart,
        effect: async (
            _,
            { cancelActiveListeners, getState, dispatch, signal },
        ) => {
            let status = slice.selectors.status(getState())
            if (!(status === "ready" || status === "error")) {
                return
            }

            cancelActiveListeners()

            dispatch(slice.actions.setStatus({ status: "syncing" }))

            let synced = await syncCtrl.sync(BaseContext.withSignal(signal))

            if (!synced.ok) {
                dispatch(
                    slice.actions.setStatus({
                        status: "error",
                        error: synced.err,
                    }),
                )
                return
            }

            dispatch(slice.actions.setStatus({ status: "ready" }))
        },
    })

    startListening({
        actionCreator: slice.actions.syncStartUploadFull,
        effect: async (
            _,
            { cancelActiveListeners, getState, dispatch, signal },
        ) => {
            let status = slice.selectors.status(getState())
            if (!(status === "ready" || status === "error")) {
                return
            }

            cancelActiveListeners()

            dispatch(slice.actions.setStatus({ status: "syncing" }))

            let synced = await syncCtrl.uploadFullDB(
                BaseContext.withSignal(signal),
            )

            if (!synced.ok) {
                dispatch(
                    slice.actions.setStatus({
                        status: "error",
                        error: synced.err,
                    }),
                )
                return
            }

            dispatch(slice.actions.setStatus({ status: "ready" }))
        },
    })

    startListening({
        actionCreator: slice.actions.syncStartDownloadFull,
        effect: async (
            _,
            { cancelActiveListeners, getState, dispatch, signal },
        ) => {
            let status = slice.selectors.status(getState())
            if (!(status === "ready" || status === "error")) {
                return
            }

            cancelActiveListeners()

            dispatch(slice.actions.setStatus({ status: "syncing" }))

            let synced = await syncCtrl.fetchFullDB(
                BaseContext.withSignal(signal),
            )

            if (!synced.ok) {
                dispatch(
                    slice.actions.setStatus({
                        status: "error",
                        error: synced.err,
                    }),
                )
                return
            }

            dispatch(slice.actions.setStatus({ status: "ready" }))
        },
    })
}
