import {
    combineSlices,
    configureStore,
    createListenerMiddleware,
} from "@reduxjs/toolkit"

import type { Account } from "@/domain/Account"
import type { BuildInfo } from "@/domain/BuildInfo"
import type { Settings } from "@/domain/Settings"
import type { AttachmentStorage } from "@/storage/attachments"
import type { MemoStorage } from "@/storage/memos"

import { registerEffects as registerErrorEffects } from "./errors"
import * as account from "./global/account"
import * as buildInfo from "./global/buildInfo"
import * as i18n from "./global/i18n"
import * as notifications from "./global/notifications"
import * as router from "./global/router"
import * as settings from "./global/settings"
import * as storage from "./global/storage"

import * as attachments from "./attachments"
import * as memos from "./memos"
import * as tags from "./tags"

const listenerMiddleware = createListenerMiddleware()

let startListening = listenerMiddleware.startListening.withTypes<
    RootState,
    AppDispatch
>()

export function configureRootStore(initState: {
    baseURL?: string
    buildInfo?: BuildInfo
    router?: { href: string }
    account?: Account
    settings?: Settings
}) {
    let rootReducer = combineSlices(
        storage.slice,
        router.slice,
        buildInfo.slice,
        account.slice,
        notifications.slice,
        i18n.slice,
        settings.slice,

        memos.slice,
        tags.slice,
        attachments.slice,
    )

    const store = configureStore({
        reducer: rootReducer,

        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActionPaths: [
                        /.*\.(createdAt|updatedAt|expiresAt|exactDate)/,
                        /.*\.error/,
                        "payload.content",
                        "payload.next",
                        "payload.translations",
                        "payload.dateFns",
                        "payload.data",
                        "payload.params",
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
                        /.*\.buttons/,
                    ],
                },
            }).prepend(listenerMiddleware.middleware),
    })

    if (import.meta.hot) {
        import.meta.hot.accept(() => store.replaceReducer(rootReducer))
    }

    // storage.registerEffects(startListening)
    router.registerEffects(startListening)
    settings.registerEffects(startListening)
    i18n.registerEffects(startListening)
    // attachments.registerEffects(startListening)
    memos.registerEffects(startListening)
    registerErrorEffects(startListening)

    if (initState.buildInfo) {
        store.dispatch(buildInfo.slice.actions.init(initState.buildInfo))
    }

    if (initState.settings) {
        store.dispatch(settings.slice.actions.init(initState.settings))
        store.dispatch(
            i18n.slice.actions.set({
                language: initState.settings.locale.language,
                region: initState.settings.locale.region,
            }),
        )
    }

    if (initState.router?.href) {
        store.dispatch(
            router.slice.actions.init({
                href: initState.router?.href,
                baseURL: initState.baseURL,
            }),
        )
    }

    if (initState.account) {
        store.dispatch(account.slice.actions.init(initState.account))
    }

    return store
}

export type RootState = ReturnType<
    ReturnType<typeof configureRootStore>["getState"]
>
export type AppDispatch = ReturnType<typeof configureRootStore>["dispatch"]
export type StartListening = typeof startListening

export function initializeStorage({
    memoStorage,
    attachmentStorage,
}: {
    memoStorage: MemoStorage
    attachmentStorage: AttachmentStorage
}) {
    memos.registerStorageEffects({
        memoStorage,
        startListening,
    })

    tags.registerStorageEffects({
        memoStorage,
        startListening,
    })

    attachments.registerStorageEffects({
        attachmentStorage,
        startListening,
    })
}
