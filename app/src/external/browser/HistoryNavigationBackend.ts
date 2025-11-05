import { queueTask } from "@/lib/microtask"
import type {
    NavgationState,
    NavigationBackend,
    OnPop,
    OnPush,
    Screens,
    ScreenToStackMapping,
} from "@/lib/navigation"

declare const __ENABLE_DEVTOOLS__: boolean

type Route<S extends Screens, K extends keyof S = keyof S> = {
    route: string
    screen: K
    stack: S[K]["stack"]
    parseParams: (u: URL) => S[K]["params"]
}

type HistoryNavigationState<S extends Screens> = {
    current: NavgationState<S>
    prev: NavgationState<S>[]
}

export class HistoryNavigationBackend<
    S extends Screens,
    Params extends Record<keyof S, Record<string, unknown>>,
> implements NavigationBackend<S>
{
    private _routes: Route<S>[] = []
    private _stacks: ScreenToStackMapping<S>

    private _events = {
        pop: [] as OnPop<S>[],
        push: [] as OnPush<S>[],
    }

    private get _currentState(): HistoryNavigationState<S> {
        return { prev: [], ...(window.history.state ?? {}) }
    }

    // private _pushState(next: NavgationState<S>) {
    //     let curr = this._currentState
    //     window.history.state = {...curr, prev: [
    //         curr.current,
    //         curr.prev,
    //     ]}
    // }

    constructor({
        routes,
    }: {
        routes: Route<S>[]
    }) {
        this._routes = routes

        this._stacks = {} as any
        for (let r of routes) {
            this._stacks[r.screen] = r.stack
        }

        history.scrollRestoration = "manual"
        //
        // window.addEventListener("popstate", (e: PopStateEvent) => {
        //     if (!e.state) {
        //         return
        //     }
        //
        //     let { screen, params, stack } = e.state as NavgationState<S>
        //
        //     let lastIndex = this._currentIndex
        //     requestAnimationFrame(() => {
        //         if (lastIndex < this._currentIndex) {
        //             this._triggerEvent("push", { screen, stack, params }, this._lastState)
        //             if (__ENABLE_DEVTOOLS__) {
        //                 requestAnimationFrame(() => {
        //                     performance.mark("navigation:push", {
        //                         detail: {
        //                             ...e.state,
        //                             url: window.location.href,
        //                         },
        //                     })
        //                 })
        //             }
        //         } else {
        //             this._triggerEvent("pop", { screen, stack, params }, this._lastState)
        //
        //             if (__ENABLE_DEVTOOLS__) {
        //                 requestAnimationFrame(() => {
        //                     performance.mark("navigation:pop", {
        //                         detail: {
        //                             ...e.state,
        //                             url: window.location.href,
        //                         },
        //                     })
        //                 })
        //             }
        //         }
        //     })
        // })
    }

    init(state: NavgationState<S>): NavgationState<S> {
        let currentURL = new URL(window.location.href)
        let mapped = this._mapURLToScreen(currentURL)

        let initial: HistoryNavigationState<S> = {
            current: { ...state },
            prev: [],
        }
        let current = window.history.state as HistoryNavigationState<S>
        if (current) {
            initial = {
                current: {
                    ...initial.current,
                    ...current.current,
                },
                prev: current.prev || initial.prev,
            }
        }

        initial.current.screen = mapped?.screen ?? initial.current.screen
        initial.current.stack = mapped?.stack ?? initial.current.stack

        if (mapped?.params) {
            initial.current.params = {
                ...initial.current.params,
                ...mapped.params,
            }
        }

        window.history.replaceState(initial, "", window.location.href)

        if (__ENABLE_DEVTOOLS__) {
            performance.mark("navigation:init", {
                detail: {
                    url: window.location.href,
                    ...initial,
                },
            })
        }

        return initial.current
    }

    public push(next: Omit<NavgationState<S>, "stack">): NavgationState<S> {
        let lastState = this._currentState

        let nextScreen: NavgationState<S> = {
            ...next,
            stack: this._stacks[next.screen],
        }

        let nextURL = this._nextURL(next.screen as string, next.params as Params[keyof S])

        window.history.replaceState(
            {
                current: nextScreen,
                prev: [lastState.current, ...lastState.prev],
            },
            "",
            nextURL,
        )

        if (__ENABLE_DEVTOOLS__) {
            let trace: { stack: typeof Error.prototype.stack } = { stack: "" }
            Error.captureStackTrace(trace)

            requestAnimationFrame(() => {
                performance.mark("navigation:push", {
                    detail: {
                        ...nextScreen,
                        url: nextURL.toString(),
                        trace: trace.stack,
                    },
                })
            })
        }

        this._triggerEvent("push", nextScreen, lastState.current)

        return nextScreen
    }

    public pop(): Promise<NavgationState<S>> {
        let lastState = this._currentState

        let nextScreen =
            lastState.prev[0] ?? this._mapURLToScreen(new URL("/", window.location.href))
        let nextURL = this._nextURL(
            nextScreen.screen as string,
            nextScreen.params as Params[keyof S],
        )

        let { promise, resolve } = Promise.withResolvers<NavgationState<S>>()

        window.history.replaceState(
            {
                current: nextScreen,
                prev: [...lastState.prev.slice(1)],
            },
            "",
            nextURL,
        )

        let trace: { stack: typeof Error.prototype.stack } = { stack: "" }
        if (__ENABLE_DEVTOOLS__) {
            Error.captureStackTrace(trace)
        }

        requestAnimationFrame(() => {
            let state = this._currentState.current

            if (__ENABLE_DEVTOOLS__) {
                performance.mark("navigation:pop", {
                    detail: {
                        ...state,
                        url: window.location.href,
                        trace: trace.stack,
                    },
                })
            }

            resolve(state)
        })

        promise.then((nextScreen) => {
            this._triggerEvent("pop", nextScreen, lastState.current)
        })

        return promise
    }

    addEventListener(event: "pop", handler: OnPop<S>): () => void
    addEventListener(event: "push", handler: OnPush<S>): () => void
    addEventListener(event: "pop" | "push", handler: OnPop<S> | OnPush<S>): () => void {
        this._events[event].push(handler)
        return () => {
            this._events[event] = this._events[event].filter((i) => handler !== i)
        }
    }

    private _triggerEvent(event: "pop", ...data: Parameters<OnPop<S>>): void
    private _triggerEvent(event: "push", ...data: Parameters<OnPush<S>>): void
    private _triggerEvent(
        event: "pop" | "push",
        ...data: Parameters<OnPop<S>> | Parameters<OnPush<S>>
    ): void {
        this._events[event].forEach((cb) => {
            queueTask(() => cb(data[0], data[1]))
        })
    }

    private _nextURL(screen: string, params: Params[keyof S]): URL {
        let path = this._routes.find((r) => r.screen === screen)?.route ?? "/"
        let nextURL = new URL(path, window.location.href)

        for (let key in params) {
            if (params[key] && Array.isArray(params[key])) {
                nextURL.searchParams.set(key, `${params[key].join(",")}`)
            } else if (params[key]) {
                nextURL.searchParams.set(key, `${params[key]}`)
            }
        }

        return nextURL
    }

    private _mapURLToScreen(u: URL) {
        for (let r of this._routes) {
            if (u.pathname === r.route) {
                return {
                    screen: r.screen,
                    stack: r.stack,
                    params: r.parseParams(u),
                }
            }
        }
    }

    public static screensToRoutes<S extends Screens, K extends keyof S = keyof S>(
        screens: (
            | [K, S[K]["stack"]]
            | [K, S[K]["stack"], string]
            | [K, S[K]["stack"], string | undefined, ((u: URL) => S[K]["params"]) | undefined]
        )[],
    ): Route<S>[] {
        return screens.map(([sc, st, rt, pr]) => ({
            route: rt ?? `/${sc as string}`,
            screen: sc,
            stack: st,
            parseParams: pr ?? (() => ({}) as any),
        }))
    }
}

export type ScreenToURLMapping<S extends Screens> = Record<keyof S, string>

export type URLToScreenMapping<S extends Screens, K extends keyof S = keyof S> = (
    s: URL,
) => { screen: K; stack: S[K]["stack"]; params: S[K]["params"] } | undefined
