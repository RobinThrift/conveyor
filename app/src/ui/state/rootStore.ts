import {
    combineSlices,
    configureStore,
    createListenerMiddleware,
} from "@reduxjs/toolkit"

import type { AttachmentController } from "@/control/AttachmentController"
import type { AuthController } from "@/control/AuthController"
import type { MemoController } from "@/control/MemoController"
import type { SettingsController } from "@/control/SettingsController"
import type { SetupController } from "@/control/SetupController"
import type { SyncController } from "@/control/SyncController"
import type { UnlockController } from "@/control/UnlockController"

import * as attachments from "./attachments"
import * as auth from "./auth"
import { registerEffects as registerErrorEffects } from "./errors"
import * as i18n from "./global/i18n"
import * as notifications from "./global/notifications"
import * as router from "./global/router"
import * as memos from "./memos"
import * as settings from "./settings"
import * as setup from "./setup"
import * as sync from "./sync"
import * as tags from "./tags"
import * as unlock from "./unlock"

const listenerMiddleware = createListenerMiddleware()

let startListening = listenerMiddleware.startListening.withTypes<
    RootState,
    AppDispatch
>()

export function configureRootStore(initState: {
    baseURL?: string
    router?: { href: string }
}) {
    let rootReducer = combineSlices(
        router.slice,
        notifications.slice,
        i18n.slice,

        settings.slice,
        memos.slice,
        tags.slice,
        attachments.slice,
        sync.slice,
        auth.slice,
        setup.slice,
        unlock.slice,
    )

    const store = configureStore({
        reducer: rootReducer,

        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: false,
                serializableCheck: {
                    ignoredActions: [
                        "setup/setupCandidatePrivateCryptoKey",
                        "settings/setError",
                    ],
                    ignoredActionPaths: [
                        /.*\.(createdAt|updatedAt|expiresAt|exactDate)/,
                        /.*\.error/,
                        "payload.content",
                        "payload.next",
                        "payload.translations",
                        "payload.dateFns",
                        "payload.data",
                        "payload.params",
                        "payload.pagination.after",
                        "payload.lastSyncedAt",
                        /.*\.buttons/,
                    ],
                    ignoredPaths: [
                        "global.router.routes",
                        /.*\.(createdAt|updatedAt|expiresAt|exactDate)/,
                        /.*\.error/,
                        "memos.list.nextPage",
                        "global.i18n.translations",
                        "global.i18n.baseTranslations",
                        "global.i18n.dateFns",
                        "setup.selectedOptions.candidatePrivateCryptoKey",
                        /.*\.buttons/,
                        "sync.info.lastSyncedAt",
                    ],
                },
            }).prepend(listenerMiddleware.middleware),
    })

    if (import.meta.hot) {
        import.meta.hot.accept(() => store.replaceReducer(rootReducer))
    }

    router.registerEffects(startListening)
    i18n.registerEffects(startListening)
    registerErrorEffects(startListening)

    if (initState.router?.href) {
        store.dispatch(
            router.slice.actions.init({
                href: initState.router?.href,
                baseURL: initState.baseURL,
            }),
        )
    }

    return store
}

export type RootState = ReturnType<
    ReturnType<typeof configureRootStore>["getState"]
>
export type AppDispatch = ReturnType<typeof configureRootStore>["dispatch"]
export type StartListening = typeof startListening

export function configureEffects({
    memoCtrl,
    attachmentCtrl,
    settingsCtrl,
    syncCtrl,
    authCtrl,
    setupCtrl,
    unlockCtrl,
}: {
    memoCtrl: MemoController
    attachmentCtrl: AttachmentController
    settingsCtrl: SettingsController
    syncCtrl: SyncController
    authCtrl: AuthController
    setupCtrl: SetupController
    unlockCtrl: UnlockController
}) {
    memos.registerEffects(startListening, {
        memoCtrl,
    })

    tags.registerEffects(startListening, {
        memoCtrl,
    })

    attachments.registerEffects(startListening, {
        attachmentCtrl,
    })

    settings.registerEffects(startListening, {
        settingsCtrl,
    })

    sync.registerEffects(startListening, {
        syncCtrl,
    })

    auth.registerEffects(startListening, {
        authCtrl,
    })

    setup.registerEffects(startListening, {
        setupCtrl,
    })

    unlock.registerEffects(startListening, {
        unlockCtrl,
    })
}

/*
 logger middleware
     ((store) =>
     (next) =>
     (action) => {
         console.log("dispatching", action)
         let result = next(action)
         console.log("next state", store.getState())
         return result
     }) as Middleware
 */
