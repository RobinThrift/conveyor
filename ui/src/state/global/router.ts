import { history } from "@/external/history"
import type { StartListening } from "@/state/rootStore"
import { type PayloadAction, createSlice } from "@reduxjs/toolkit"
import { useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"

import {
    type Page,
    type RouteDefinitions,
    type Routes,
    createRoutes,
    matchRoute,
} from "./router.types"
export { createRoutes } from "./router.types"

let routes = {
    login: "/login",
    "login.change_password": "/auth/change_password",
    "memos.list": "/",
    "memos.new": "/memos/new",
    "memos.single": "/memos/:id",
    "memos.edit": "/memos/:id/edit",
    settings: "/settings/:tab/:subsection?",
}

export interface RouterState<
    Definitions extends RouteDefinitions,
    P extends Page<Definitions> = Page<Definitions>,
> {
    page: P | undefined
    routes: Routes
    baseURL?: string
    cacheKey: string | undefined
}

const initialState: RouterState<typeof routes> = {
    baseURL: "",
    page: undefined,
    routes: createRoutes(routes),
    cacheKey: undefined,
}

export const slice = createSlice({
    name: "router",
    reducerPath: "global.router",
    initialState,
    reducers: {
        init: (
            state,
            {
                payload: { href, baseURL },
            }: PayloadAction<{ href: string; baseURL?: string }>,
        ) => {
            let [page, cacheKey] = matchRoute(
                state.routes,
                href,
                baseURL || state.baseURL,
                state.cacheKey,
            )

            return {
                ...state,
                page,
                baseURL: baseURL || state.baseURL,
                cacheKey,
            }
        },

        setPage: (
            state,
            { payload: { path } }: PayloadAction<{ path: string }>,
        ) => {
            let [page, cacheKey] = matchRoute(
                state.routes,
                path,
                state.baseURL,
                state.cacheKey,
            )

            if (cacheKey === state.cacheKey) {
                return state
            }

            return {
                ...state,
                page,
                cacheKey,
            }
        },

        goto: (
            state,
            {
                payload,
            }: PayloadAction<{
                path: string
                params?: URLSearchParams
                replace?: boolean
            }>,
        ) => {
            let path = payload.path
            if (payload.params) {
                path = `${path}?${payload.params.toString()}`
            }

            let [page, cacheKey] = matchRoute(
                state.routes,
                path,
                state.baseURL,
                state.cacheKey,
            )

            if (cacheKey === state.cacheKey) {
                return state
            }

            return {
                ...state,
                page,
                cacheKey,
            }
        },
    },
    selectors: {
        currentPage: (state) => state.page,
        baseURL: (state) => state.baseURL,
    },
})

export const registerEffects = (startListening: StartListening) => {
    startListening({
        actionCreator: slice.actions.goto,
        effect: async ({ payload: { path, params, replace } }, listenerApi) => {
            listenerApi.cancelActiveListeners()

            let prev = listenerApi.getOriginalState()["global.router"]
            let state = listenerApi.getState()["global.router"]

            if (prev.cacheKey === state.cacheKey) {
                return
            }

            let fullPath = state.baseURL + path

            if (replace) {
                history.replaceState(fullPath, params)
            } else {
                history.pushState(fullPath, params)
            }
        },
    })
}

export function useCurrentPage() {
    return useSelector(slice.selectors.currentPage)
}

export function useGoto() {
    let dispatch = useDispatch()
    return useCallback(
        (
            path: string,
            params?: URLSearchParams,
            {
                replace,
                viewTransition,
            }: { replace?: boolean; viewTransition?: boolean } = {},
        ) => {
            if (viewTransition && "startViewTransition" in document) {
                document.startViewTransition(() => {
                    dispatch(slice.actions.goto({ path, params, replace }))
                })
            } else {
                dispatch(slice.actions.goto({ path, params, replace }))
            }
        },
        [dispatch],
    )
}

export function useGoBack() {
    let dispatch = useDispatch()
    return useCallback(
        ({
            viewTransition,
            fallback,
        }: { viewTransition?: boolean; fallback?: string } = {}) => {
            let goback = () => {
                if (history.length > 2) {
                    history.back()
                    return
                }

                if (!fallback) {
                    return
                }

                dispatch(slice.actions.goto({ path: fallback }))
            }

            if (viewTransition && "startViewTransition" in document) {
                document.startViewTransition(goback)
                return
            }

            goback()
        },
        [dispatch],
    )
}

export function useSetPage() {
    let dispatch = useDispatch()
    return useCallback(
        (path: string) => dispatch(slice.actions.setPage({ path })),
        [dispatch],
    )
}
