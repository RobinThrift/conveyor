import type { BuildInfo } from "@/App/ServerData"
import type { Account } from "@/domain/Account"
import type { Settings } from "@/domain/Settings"
import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit"
import { combineReducers } from "redux"

import * as account from "./account"
import * as apiTokens from "./apitokens"
import * as attachments from "./attachments"
import * as buildInfo from "./buildInfo"
import * as i18n from "./i18n"
import * as memoList from "./memolist"
import * as memos from "./memos"
import * as notifications from "./notifications"
import * as router from "./router"
import * as settings from "./settings"
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
    const store = configureStore({
        reducer: {
            router: router.slice.reducer,
            buildInfo: buildInfo.slice.reducer,
            account: account.slice.reducer,
            settings: settings.slice.reducer,
            i18n: i18n.slice.reducer,
            memoList: memoList.slice.reducer,
            memos: memos.slice.reducer,
            tags: tags.slice.reducer,
            attachments: attachments.slice.reducer,
            apiTokens: apiTokens.slice.reducer,
            notifications: notifications.slice.reducer,
        },

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
                    ],
                    ignoredPaths: [
                        "router.routes",
                        /.*\.(createdAt|updatedAt|expiresAt|exactDate)/,
                        /.*\.error/,
                        "memoList.nextPage",
                        "i18n.translations",
                        "i18n.baseTranslations",
                        "i18n.dateFns",
                    ],
                },
            }).prepend(listenerMiddleware.middleware),
    })

    if (import.meta.hot) {
        import.meta.hot.accept(() =>
            store.replaceReducer(
                combineReducers({
                    router: router.slice.reducer,
                    buildInfo: buildInfo.slice.reducer,
                    account: account.slice.reducer,
                    settings: settings.slice.reducer,
                    i18n: i18n.slice.reducer,
                    memoList: memoList.slice.reducer,
                    memos: memos.slice.reducer,
                    tags: tags.slice.reducer,
                    attachments: attachments.slice.reducer,
                    apiTokens: apiTokens.slice.reducer,
                    notifications: notifications.slice.reducer,
                }),
            ),
        )
    }

    router.registerEffects(startListening)
    settings.registerEffects(startListening)
    i18n.registerEffects(startListening)
    memoList.registerEffects(startListening)
    memos.registerEffects(startListening)
    tags.registerEffects(startListening)
    attachments.registerEffects(startListening)
    apiTokens.registerEffects(startListening)

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
