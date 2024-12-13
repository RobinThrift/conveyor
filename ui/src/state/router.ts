import { type PayloadAction, createSlice } from "@reduxjs/toolkit"
import { useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { StartListening } from "./rootStore"
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
    root: "/",
    "memos.list": "/memos",
    "memos.archive": "/memos/archive",
    "memos.bin": "/memos/bin",
    "memos.single": "/memos/:id",
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
    page: undefined,
    routes: createRoutes(routes),
    cacheKey: undefined,
}

export const slice = createSlice({
    name: "router",
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
                baseURL,
                state.cacheKey,
            )

            return {
                ...state,
                page,
                baseURL,
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
                payload: { path },
            }: PayloadAction<{ path: string; replace?: boolean }>,
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
    },
    selectors: {
        currentPage: (state) => state.page,
    },
})

export const registerEffects = (startListening: StartListening) => {
    startListening({
        actionCreator: slice.actions.goto,
        effect: async ({ payload: { path, replace } }, listenerApi) => {
            listenerApi.cancelActiveListeners()

            let { router: prev } = listenerApi.getOriginalState()
            let { router: state } = listenerApi.getState()

            if (prev.cacheKey === state.cacheKey) {
                return
            }

            if (replace) {
                history.replaceState(null, "", path)
            } else {
                history.pushState(null, "", path)
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
        (path: string, replace?: boolean) =>
            dispatch(slice.actions.goto({ path, replace })),
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
