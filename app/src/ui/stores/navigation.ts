import type {
    NavigationController,
    Params,
    Restore,
    Screens,
    Stacks,
} from "@/control/NavigationController"
import type { NavgationState } from "@/lib/navigation"
import { batch, createActions, createEffect, createStore } from "@/lib/store"

import * as memos from "./memos"
import * as single from "./single"

export const currentPage = createStore<NavgationState<Screens, Restore>>("navigation/currentPage", {
    screen: "root",
    params: {},
    stack: "default",
    index: 0,
    restore: {
        scrollOffsetTop: 0,
    },
})

export const prevPage = createStore<NavgationState<Screens, Restore> | undefined>(
    "navigation/prevPage",
    undefined,
)

const updateFiltersLock = createStore("navigation/updateFiltersLock", false)

export const actions = createActions({
    init: (page: {
        screen: keyof Screens
        params: Params[keyof Screens]
        restore: Partial<Restore>
        stack?: Stacks
        index?: number
    }) => {
        batch(() => {
            currentPage.setState((prev) => ({
                screen: page.screen,
                params: page.params,
                index: page.index ?? prev.index,
                stack: page.stack ?? prev.stack,
                restore: page.restore ?? prev.restore,
            }))
            prevPage.setState(undefined)

            let screen = page.screen
            let params = page.params
            if (
                (screen === "root" || screen === "memo.view" || screen === "memo.edit") &&
                "filter" in params &&
                params.filter
            ) {
                memos.actions.setFilter(params.filter)
            }

            if (
                (screen === "root" || screen === "memo.view" || screen === "memo.edit") &&
                "memoID" in params &&
                params.memoID
            ) {
                single.actions.setSingleID(params.memoID)
            }
        })
    },
    setPage: (page: {
        name: keyof Screens
        params: Params[keyof Screens]
        restore: Partial<Restore>
        stack?: Stacks
        index?: number
    }) => {
        batch(() => {
            prevPage.setState(currentPage.state)

            currentPage.setState((prev) => ({
                screen: page.name,
                params: page.params,
                index: page.index ?? prev.index,
                stack: page.stack ?? prev.stack,
                restore: page.restore,
            }))

            if (
                (page.name === "root" || page.name === "memo.view" || page.name === "memo.edit") &&
                "filter" in page.params &&
                page.params.filter
            ) {
                memos.actions.setFilter(page.params.filter)
            }

            if (
                (page.name === "memo.view" || page.name === "memo.edit") &&
                "memoID" in page.params &&
                page.params.memoID
            ) {
                single.actions.setSingleID(page.params.memoID)
            }
        })
    },
})

export const selectors = {
    currentName: (state: typeof currentPage.state) => state.screen,
    currentParams: (state: typeof currentPage.state) => state.params,
    currentRestore: (state: typeof currentPage.state) => state.restore,
    prevName: (state: typeof prevPage.state) => state?.screen,
    prevParams: (state: typeof prevPage.state) => state?.params,
    prevRestore: (state: typeof prevPage.state) => state?.restore,
}

export function registerEffects(navCtrl: NavigationController) {
    createEffect("navigation/memoListFilter", {
        fn: async () => {
            if (updateFiltersLock.state) {
                updateFiltersLock.setState(false)
                return
            }

            let currScreen = selectors.currentName(currentPage.state)
            if (currScreen === "root" || currScreen === "memo.view" || currScreen === "memo.edit") {
                updateFiltersLock.setState(true)
                navCtrl.updateParams({
                    filter: memos.filter.state,
                })
            }
        },
        autoMount: true,
        deps: [memos.filter],
        eager: false,
    })

    createEffect("navigation/updateFiltersLock", {
        fn: async () => {
            if (updateFiltersLock.state) {
                updateFiltersLock.setState(false)
            }
        },
        autoMount: true,
        deps: [updateFiltersLock],
        eager: false,
    })

    navCtrl.addEventListener("pop", (current) => {
        actions.setPage({
            name: current.screen,
            params: current.params,
            restore: current.restore,
        })

        document.documentElement.style.setProperty(
            "min-height",
            current.restore.scrollOffsetTop
                ? `${Math.ceil(current.restore.scrollOffsetTop)}px`
                : "initial",
        )

        requestAnimationFrame(() => {
            window.scrollTo({
                left: 0,
                top: Math.ceil(current.restore.scrollOffsetTop ?? 0),
                behavior: "instant",
            })
        })
    })

    navCtrl.addEventListener("push", (current) => {
        actions.setPage({
            name: current.screen,
            params: current.params,
            restore: current.restore,
        })

        document.documentElement.style.setProperty(
            "min-height",
            current.restore.scrollOffsetTop
                ? `${Math.ceil(current.restore.scrollOffsetTop)}px`
                : "initial",
        )

        requestAnimationFrame(() => {
            window.scrollTo({
                left: 0,
                top: Math.ceil(current.restore.scrollOffsetTop ?? 0),
                behavior: "instant",
            })
        })
    })
}

if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
        if (!newModule) {
            return
        }

        newModule.currentPage.setState(currentPage.state)
        newModule.prevPage.setState(prevPage.state)
        newModule.updateFiltersLock.setState(updateFiltersLock.state)
    })
}
