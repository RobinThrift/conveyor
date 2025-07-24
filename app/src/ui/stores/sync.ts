import type { PlaintextPassword } from "@/auth"
import type { BackendClient } from "@/backend/BackendClient"
import type { SyncInfo } from "@/domain/SyncInfo"
import { batch, createActions, createEffect, createStore } from "@/lib/store"

import { randomID } from "@/lib/randomID"
import * as auth from "./auth"

export type SyncStatus =
    | "disabled"
    | "awaiting-authentication"
    | "setting-up"
    | "ready"
    | "syncing"
    | "error"
    | "resetting"

export const status = createStore<SyncStatus>("sync/status", "disabled")

const isSyncRequested = createStore<false | "full" | "partial">("sync/isSyncRequested", false)

const isFullUploadRequested = createStore<boolean>("sync/isFullUploadRequested", false)

export const info = createStore<SyncInfo>("sync/info", { isEnabled: false })

const setup = createStore<{ server: string; username: string } | undefined>("sync/setup", undefined)

export const setupRequest = createStore<
    { server: string; username: string; password: PlaintextPassword } | undefined
>("sync/setupRequest", undefined)

export const error = createStore<Error | undefined>("sync/error", undefined)

const loadSyncInfoRequest = createStore("sync/loadSyncInfoRequest", false)

export const actions = createActions({
    loadSyncInfo: () => {
        batch(() => {
            error.setState(undefined)
            loadSyncInfoRequest.setState(true)
        })
    },

    setup: (params: {
        server: string
        username: string
        password: PlaintextPassword
    }) => {
        batch(() => {
            status.setState("disabled")
            setup.setState(params)
            error.setState(undefined)
            setupRequest.setState(params)
        })
    },

    disable: () => {
        batch(() => {
            status.setState("disabled")
            info.setState({ isEnabled: false })
            error.setState(undefined)
        })
    },

    syncStart: () => {
        batch(() => {
            isSyncRequested.setState("partial")
            error.setState(undefined)
        })
    },

    syncStartUploadFull: () => {
        batch(() => {
            isFullUploadRequested.setState(true)
            error.setState(undefined)
        })
    },

    syncStartDownloadFull: () => {
        batch(() => {
            isSyncRequested.setState("full")
            error.setState(undefined)
        })
    },

    reset: () => {
        batch(() => {
            info.setState({ isEnabled: false })
            error.setState(undefined)
            isSyncRequested.setState(false)
            status.setState("resetting")
        })
    },
})

export const selectors = {
    isEnabled: (state: typeof info.state) => state.isEnabled,
}

export function registerEffects(backend: BackendClient) {
    createEffect("sync/setup", {
        fn: async (ctx) => {
            if (status.state !== "disabled" && status.state !== "error") {
                return
            }
            let req = setupRequest.state
            if (!req) {
                return
            }

            setupRequest.setState(undefined)

            let authStatus = auth.status.state
            if (authStatus !== "authenticated") {
                batch(() => {
                    status.setState("awaiting-authentication")
                    error.setState(undefined)
                    auth.actions.authenticate(req)
                })
                return
            }

            status.setState("setting-up")

            let clientID = randomID()
            let [_, err] = await backend.sync.init(ctx, {
                server: req.server,
                username: req.username,
                clientID,
            })
            if (err) {
                batch(() => {
                    status.setState("error")
                    error.setState(err)
                    isSyncRequested.setState(false)
                })
                return
            }

            batch(() => {
                info.setState({
                    isEnabled: true,
                    server: req.server,
                    username: req.username,
                    clientID,
                })
                status.setState("ready")
                error.setState(undefined)
            })
        },
        autoMount: true,
        deps: [setupRequest],
        eager: false,
    })

    createEffect("sync/setup/authenticated", {
        fn: async (ctx) => {
            if (
                status.state === "awaiting-authentication" &&
                (auth.status.state === "password-change-required" || auth.status.state === "error")
            ) {
                batch(() => {
                    status.setState("error")
                    error.setState(auth.error.state)
                    isSyncRequested.setState(false)
                })
                return
            }

            if (auth.status.state === "not-authenticated") {
                batch(() => {
                    status.setState("disabled")
                    isSyncRequested.setState(false)
                    info.setState({ isEnabled: false })
                })
                return
            }

            if (auth.status.state !== "authenticated") {
                return
            }

            if (status.state !== "awaiting-authentication") {
                return
            }

            let { server, username } = setup.state ?? {}
            if (!server || !username) {
                return
            }

            status.setState("setting-up")

            let clientID = randomID()
            let [_, err] = await backend.sync.init(ctx, {
                server,
                username,
                clientID,
            })
            if (err) {
                batch(() => {
                    status.setState("error")
                    error.setState(err)
                    isSyncRequested.setState(false)
                })
                return
            }

            batch(() => {
                status.setState("ready")
                error.setState(undefined)
                isSyncRequested.setState(false)
                info.setState({
                    isEnabled: true,
                    server,
                    username,
                    clientID,
                })
            })
        },
        autoMount: true,
        deps: [auth.status],
        eager: false,
    })

    createEffect("sync/loadSyncInfo", {
        fn: async (ctx) => {
            loadSyncInfoRequest.setState(false)

            let [syncInfo, err] = await backend.sync.load(ctx)
            if (err) {
                batch(() => {
                    status.setState("error")
                    error.setState(err)
                })
            }

            batch(() => {
                status.setState("ready")
                error.setState(undefined)
                if (syncInfo) {
                    info.setState(syncInfo)
                }
            })
        },
        autoMount: true,
        deps: [loadSyncInfoRequest],
        precondition: () => loadSyncInfoRequest.state,
        eager: false,
    })

    createEffect("sync/partial", {
        fn: async (ctx) => {
            if (isSyncRequested.state !== "partial") {
                return
            }
            isSyncRequested.setState(false)

            if (!(status.state === "ready" || status.state === "error")) {
                return
            }

            status.setState("syncing")

            let [, err] = await backend.sync.sync(ctx)
            if (err) {
                batch(() => {
                    status.setState("error")
                    error.setState(err)
                })
            }

            batch(() => {
                status.setState("ready")
                error.setState(undefined)
            })

            actions.loadSyncInfo()
        },
        autoMount: true,
        deps: [isSyncRequested],
        precondition: () =>
            (status.state === "ready" || status.state === "error") &&
            isSyncRequested.state === "partial",
        eager: false,
    })

    createEffect("sync/fullDownload", {
        fn: async (ctx) => {
            if (isSyncRequested.state !== "full") {
                return
            }
            isSyncRequested.setState(false)

            if (!(status.state === "ready" || status.state === "error")) {
                return
            }

            status.setState("syncing")

            let [, err] = await backend.sync.fetchFullDB(ctx)
            if (err) {
                batch(() => {
                    status.setState("error")
                    error.setState(err)
                })
            }

            batch(() => {
                status.setState("ready")
                error.setState(err)
            })
        },
        autoMount: true,
        deps: [isSyncRequested],
        precondition: () =>
            (status.state === "ready" || status.state === "error") &&
            isSyncRequested.state === "full",
        eager: false,
    })

    createEffect("sync/fullUpload", {
        fn: async (ctx) => {
            if (!isFullUploadRequested) {
                return
            }
            isFullUploadRequested.setState(false)

            if (!(status.state === "ready" || status.state === "error")) {
                return
            }

            status.setState("syncing")

            let [, err] = await backend.sync.uploadFullDB(ctx)
            if (err) {
                batch(() => {
                    status.setState("error")
                    error.setState(err)
                })
            }

            batch(() => {
                status.setState("ready")
                error.setState(undefined)
            })
        },
        autoMount: true,
        deps: [isFullUploadRequested],
        precondition: () =>
            (status.state === "ready" || status.state === "error") && isFullUploadRequested.state,
        eager: false,
    })

    createEffect("sync/reset", {
        fn: async (ctx) => {
            status.setState("disabled")
            let [, err] = await backend.sync.reset(ctx)
            if (err) {
                console.error(err)
            }
        },
        autoMount: true,
        precondition: () => status.state === "resetting",
        deps: [status],
        eager: false,
    })
}

if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
        if (!newModule) {
            return
        }

        newModule.status.setState(status.state)
        newModule.info.setState(info.state)
    })
}
