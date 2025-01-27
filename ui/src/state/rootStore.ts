import type { BuildInfo } from "@/App/ServerData"
import type { Account } from "@/domain/Account"
import type { Settings } from "@/domain/Settings"
import {
    combineSlices,
    configureStore,
    createListenerMiddleware,
} from "@reduxjs/toolkit"

import { registerEffects as registerErrorEffects } from "./errors"
import * as account from "./global/account"
import * as attachments from "./global/attachments"
import * as buildInfo from "./global/buildInfo"
import * as i18n from "./global/i18n"
import * as notifications from "./global/notifications"
import * as router from "./global/router"
import * as settings from "./global/settings"

import * as apiTokenEntities from "./entities/apitokens"
import * as memoEntites from "./entities/memos"
import * as tagEntities from "./entities/tags"

import * as pageMemoEdit from "./pages/Memos/Edit/state"
import * as pageMemoList from "./pages/Memos/List/state"
import * as pageMemoNew from "./pages/Memos/New/state"
import * as pageMemoSingle from "./pages/Memos/Single/state"

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
        router.slice,
        buildInfo.slice,
        account.slice,
        notifications.slice,
        attachments.slice,
        i18n.slice,
        settings.slice,

        tagEntities.slice,
        memoEntites.slice,
        apiTokenEntities.slice,

        pageMemoList.slice,
        pageMemoSingle.slice,
        pageMemoEdit.slice,
        pageMemoNew.slice,
    )

    const store = configureStore({
        reducer: rootReducer,

        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActionPaths: [
                        /.*\.(createdAt|updatedAt|expiresAt|exactDate)/,
                        /.*\.error/,
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
                        /pages\..*\.nextPage/,
                        "global.i18n.translations",
                        "global.i18n.baseTranslations",
                        "global.i18n.dateFns",
                        // /.*\.buttons/,
                    ],
                },
            }).prepend(listenerMiddleware.middleware),
    })

    if (import.meta.hot) {
        import.meta.hot.accept(() => store.replaceReducer(rootReducer))
    }

    router.registerEffects(startListening)
    settings.registerEffects(startListening)
    i18n.registerEffects(startListening)
    attachments.registerEffects(startListening)
    apiTokenEntities.registerEffects(startListening)
    memoEntites.registerEffects(startListening)
    tagEntities.registerEffects(startListening)
    registerErrorEffects(startListening)

    pageMemoList.registerEffects(startListening)
    pageMemoSingle.registerEffects(startListening)
    pageMemoEdit.registerEffects(startListening)
    pageMemoNew.registerEffects(startListening)

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
