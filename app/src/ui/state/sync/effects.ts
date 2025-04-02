import type { SyncController } from "@/control/SyncController"
import { BaseContext } from "@/lib/context"
import { randomID } from "@/lib/randomID"
import type { StartListening } from "@/ui/state/rootStore"

import * as auth from "../auth"
import { slice } from "./slice"

export const registerEffects = (
    startListening: StartListening,
    { syncCtrl }: { syncCtrl: SyncController },
) => {
    startListening({
        actionCreator: auth.actions.setAuthStatus,
        effect: async (
            { payload },
            { cancelActiveListeners, getState, dispatch, signal },
        ) => {
            let state = getState()
            let status = slice.selectors.status(state)

            if (
                status === "awaiting-authentication" &&
                (payload.status === "password-change-required" ||
                    payload.status === "error")
            ) {
                dispatch(
                    slice.actions.setStatus({
                        status: "error",
                        isSyncRequested: false,
                    }),
                )
                return
            }

            if (payload.status === "not-authenticated") {
                dispatch(
                    slice.actions.setStatus({
                        status: "disabled",
                        isSyncRequested: false,
                    }),
                )
                dispatch(slice.actions.setSyncInfo({ isEnabled: false }))
                return
            }

            if (payload.status !== "authenticated") {
                return
            }

            if (status !== "awaiting-authentication") {
                return
            }

            let { server, username } = slice.selectors.setupInfo(state) ?? {}
            if (!server || !username) {
                return
            }

            dispatch(slice.actions.setStatus({ status: "setting-up" }))

            cancelActiveListeners()

            let ctx = BaseContext.withSignal(signal)
            let clientID = randomID()

            let initRes = await syncCtrl.init(ctx, {
                server,
                username,
                clientID,
            })
            if (!initRes.ok) {
                dispatch(
                    slice.actions.setStatus({
                        status: "error",
                        error: initRes.err,
                        isSyncRequested: false,
                    }),
                )
                return
            }

            dispatch(
                slice.actions.setSyncInfo({
                    isEnabled: true,
                    server,
                    username,
                    clientID,
                }),
            )
            dispatch(slice.actions.setStatus({ status: "ready" }))
        },
    })

    startListening({
        actionCreator: slice.actions.setup,
        effect: async (
            { payload },
            { cancelActiveListeners, getState, dispatch, signal },
        ) => {
            let state = getState()

            let status = slice.selectors.status(state)
            if (status !== "disabled" && status !== "error") {
                return
            }

            cancelActiveListeners()

            let authStatus = auth.selectors.status(state)
            if (authStatus !== "authenticated") {
                dispatch(
                    slice.actions.setStatus({
                        status: "awaiting-authentication",
                    }),
                )
                dispatch(
                    auth.actions.authenticate({
                        server: payload.server,
                        username: payload.username,
                        password: payload.password,
                    }),
                )
                return
            }

            dispatch(slice.actions.setStatus({ status: "setting-up" }))

            let ctx = BaseContext.withSignal(signal)
            let clientID = randomID()

            let initRes = await syncCtrl.init(ctx, {
                server: payload.server,
                username: payload.username,
                clientID,
            })
            if (!initRes.ok) {
                dispatch(
                    slice.actions.setStatus({
                        status: "error",
                        error: initRes.err,
                        isSyncRequested: false,
                    }),
                )
                return
            }

            dispatch(
                slice.actions.setSyncInfo({
                    isEnabled: true,
                    server: payload.server,
                    username: payload.username,
                    clientID,
                }),
            )
            dispatch(slice.actions.setStatus({ status: "ready" }))
        },
    })

    startListening({
        actionCreator: slice.actions.loadSyncInfo,
        effect: async (_, { cancelActiveListeners, dispatch, signal }) => {
            cancelActiveListeners()

            let loaded = await syncCtrl.load(BaseContext.withSignal(signal))

            if (!loaded.ok) {
                dispatch(
                    slice.actions.setStatus({
                        status: "error",
                        error: loaded.err,
                        isSyncRequested: false,
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
                dispatch(slice.actions.setStatus({ status: "ready" }))
            }
        },
    })

    startListening({
        predicate(_, state) {
            let status = slice.selectors.status(state)
            return (
                slice.selectors.isEnabled(state) &&
                slice.selectors.isSyncRequested(state) &&
                (status === "ready" || status === "error")
            )
        },

        effect: async (_, { cancelActiveListeners, dispatch, signal }) => {
            cancelActiveListeners()

            dispatch(slice.actions.setStatus({ status: "syncing" }))

            let synced = await syncCtrl.sync(BaseContext.withSignal(signal))

            if (!synced.ok) {
                dispatch(
                    slice.actions.setStatus({
                        status: "error",
                        error: synced.err,
                        isSyncRequested: false,
                    }),
                )
                return
            }

            dispatch(
                slice.actions.setStatus({
                    status: "ready",
                    isSyncRequested: false,
                }),
            )
            dispatch(slice.actions.loadSyncInfo())
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
                        isSyncRequested: false,
                    }),
                )
                return
            }

            dispatch(
                slice.actions.setStatus({
                    status: "ready",
                    isSyncRequested: false,
                }),
            )
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
                        isSyncRequested: false,
                    }),
                )
                return
            }

            dispatch(
                slice.actions.setStatus({
                    status: "ready",
                    isSyncRequested: false,
                }),
            )
        },
    })

    startListening({
        actionCreator: slice.actions.reset,
        effect: async (_, { cancelActiveListeners, signal }) => {
            cancelActiveListeners()

            let reset = await syncCtrl.reset(BaseContext.withSignal(signal))
            if (!reset.ok) {
                console.error(reset.err)
                return
            }
        },
    })
}
