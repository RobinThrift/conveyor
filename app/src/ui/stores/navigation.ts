import type {
    NavigationController,
    Params,
    Restore,
    Screens,
    Stacks,
} from "@/control/NavigationController"
import { isEqual } from "@/lib/isEqual"
import type { NavgationState } from "@/lib/navigation"
import { batch, createActions, createEffect, createStore } from "@/lib/store"

export const currentPage = createStore<
    Omit<NavgationState<Screens, Restore>, "params" | "index" | "stack">
>("navigation/currentPage", {
    screen: "root",
    restore: {
        scrollOffsetTop: 0,
    },
})

export const currentParams = createStore<Params[keyof Params]>("navigation/currentParams", {})

const nextParams = createStore<Params[keyof Params] | undefined>("navigation/nextParams", undefined)

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
                restore: page.restore ?? prev.restore,
            }))
            currentParams.setState(page.params)
        })
    },
    setPage: (page: {
        name: keyof Screens
        params: Params[keyof Screens]
        restore: Partial<Restore>
    }) => {
        batch(() => {
            currentPage.setState((_) => ({
                screen: page.name,
                restore: page.restore,
            }))

            currentParams.setState(page.params)
        })
    },

    updateParams: (params: Partial<Params[keyof Params]>) => {
        let np: typeof params = { ...currentPage.state, ...params }
        if (Object.getOwnPropertyNames(params).length === 0) {
            np = params
        } else if (isEqual(currentParams.state, np)) {
            return
        }

        nextParams.setState(np)
    },
})

export const selectors = {
    currentName: (state: typeof currentPage.state) => state.screen,
    currentParams: (state: typeof currentParams.state) => state,
    currentRestore: (state: typeof currentPage.state) => state.restore,
}

export function registerEffects(navCtrl: NavigationController) {
    createEffect("navigation/updateNavCtrlPageParams", {
        fn: async () => {
            let np = nextParams.state
            if (!np) {
                return
            }

            nextParams.setState(undefined)
            if (!isEqual(currentParams.state, np)) {
                navCtrl.updateParams(np)
            }
        },
        autoMount: true,
        deps: [nextParams],
        precondition: () => typeof nextParams.state !== "undefined",
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

    navCtrl.addEventListener("replace", (current) => {
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
        newModule.currentParams.setState(currentParams.state)
    })
}
