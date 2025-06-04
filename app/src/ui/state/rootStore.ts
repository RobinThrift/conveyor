import {
    combineSlices,
    configureStore,
    createListenerMiddleware,
} from "@reduxjs/toolkit"

import type { APITokenController } from "@/control/APITokenController"
import type { AttachmentController } from "@/control/AttachmentController"
import type { AuthController } from "@/control/AuthController"
import type { ChangelogController } from "@/control/ChangelogController"
import type { MemoController } from "@/control/MemoController"
import type { NavigationController } from "@/control/NavigationController"
import type { SettingsController } from "@/control/SettingsController"
import type { SetupController } from "@/control/SetupController"
import type { SyncController } from "@/control/SyncController"
import type { UnlockController } from "@/control/UnlockController"
import type { Database } from "@/lib/database"
import type { FS } from "@/lib/fs"

import * as apitokens from "./apitokens"
import * as attachments from "./attachments"
import * as auth from "./auth"
import { registerEffects as registerErrorEffects } from "./errors"
import * as notifications from "./global/notifications"
import * as jobs from "./jobs"
import * as memos from "./memos"
import * as navigation from "./navigation"
import * as settings from "./settings"
import * as setup from "./setup"
import * as sync from "./sync"
import * as tags from "./tags"
import * as unlock from "./unlock"

const listenerMiddleware = createListenerMiddleware()

export const startListening = listenerMiddleware.startListening.withTypes<
    RootState,
    AppDispatch
>()

export function configureRootStore(preloadedState?: any) {
    let rootReducer = combineSlices(
        notifications.slice,

        settings.slice,
        memos.slice,
        tags.slice,
        attachments.slice,
        sync.slice,
        auth.slice,
        setup.slice,
        unlock.slice,
        apitokens.slice,
        navigation.slice,
        jobs.slice,
    )

    const store = configureStore({
        reducer: rootReducer,

        devTools: false,

        preloadedState,

        enhancers: (getDefaultEnhancers) =>
            getDefaultEnhancers({ autoBatch: false }),

        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: false,
                serializableCheck: false,
            }).prepend(listenerMiddleware.middleware),
    })

    if (import.meta.hot) {
        import.meta.hot.accept(() => store.replaceReducer(rootReducer))
    }

    registerErrorEffects(startListening)

    return store
}

export type RootStore = ReturnType<typeof configureRootStore>

export type RootState = ReturnType<
    ReturnType<typeof configureRootStore>["getState"]
>
export type AppDispatch = ReturnType<typeof configureRootStore>["dispatch"]
export type StartListening = typeof startListening

export function configureEffects(
    rootStore: RootStore,
    {
        memoCtrl,
        attachmentCtrl,
        settingsCtrl,
        syncCtrl,
        authCtrl,
        setupCtrl,
        unlockCtrl,
        apiTokenCtrl,
        navCtrl,
        changelogCtrl,
        db,
        fs,
    }: {
        memoCtrl: MemoController
        attachmentCtrl: AttachmentController
        settingsCtrl: SettingsController
        syncCtrl: SyncController
        authCtrl: AuthController
        setupCtrl: SetupController
        unlockCtrl: UnlockController
        apiTokenCtrl: APITokenController
        navCtrl: NavigationController
        changelogCtrl: ChangelogController
        db: Database
        fs: FS
    },
) {
    memos.registerEffects(startListening, {
        memoCtrl,
        rootStore,
    })

    tags.registerEffects(startListening, {
        memoCtrl,
    })

    attachments.registerEffects(startListening, {
        attachmentCtrl,
    })

    settings.registerEffects(startListening, {
        settingsCtrl,
        rootStore,
    })

    sync.registerEffects(startListening, {
        syncCtrl,
    })

    auth.registerEffects(startListening, {
        authCtrl,
    })

    setup.registerEffects(startListening, {
        setupCtrl,
        navCtrl,
    })

    unlock.registerEffects(startListening, {
        unlockCtrl,
        navCtrl,
    })

    apitokens.registerEffects(startListening, {
        apiTokenCtrl,
    })

    navigation.registerEffects(startListening, {
        navCtrl,
    })

    jobs.registerEffects(startListening, {
        memoCtrl,
        changelogCtrl,
        db,
        fs,
    })
}
