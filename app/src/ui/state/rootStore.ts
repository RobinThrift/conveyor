import {
    combineSlices,
    configureStore,
    createListenerMiddleware,
} from "@reduxjs/toolkit"

import type { AttachmentController } from "@/control/AttachmentController"
import type { MemoController } from "@/control/MemoController"
import type { SettingsController } from "@/control/SettingsController"

import * as attachments from "./attachments"
import { registerEffects as registerErrorEffects } from "./errors"
import * as i18n from "./global/i18n"
import * as notifications from "./global/notifications"
import * as router from "./global/router"
import * as memos from "./memos"
import * as settings from "./settings"
import * as tags from "./tags"

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
}: {
    memoCtrl: MemoController
    attachmentCtrl: AttachmentController
    settingsCtrl: SettingsController
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
}
