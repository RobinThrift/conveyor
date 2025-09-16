import type {
    NavgationState,
    NavigationBackend,
    OnPop,
    OnPush,
    OnReplace,
    Screens,
    ScreenToStackMapping,
} from "@/lib/navigation"

declare const __ENABLE_DEVTOOLS__: boolean

export class HistoryNavigationBackend<
    S extends Screens,
    Params extends Record<keyof S, Record<string, unknown>>,
    Restore extends Record<string, unknown>,
> implements NavigationBackend<S, Restore>
{
    private _onPush?: OnPush<S, Restore>
    private _onPop?: OnPop<S, Restore>
    private _onReplace?: OnReplace<S, Restore>
    private _toURLParams?: (params: Params[keyof S]) => URLSearchParams
    private _screenToURLMapping: ScreenToURLMapping<S>
    private _urlToScreenMapping: URLToScreenMapping<S>
    private _screenToStackMapping: ScreenToStackMapping<S>

    private _currentIndex = window.history.length
    private readonly _initalLength = window.history.length

    constructor({
        screenToURLMapping,
        urlToScreenMapping,
        screenToStackMapping,
        toURLParams,
    }: {
        screenToURLMapping: ScreenToURLMapping<S>
        urlToScreenMapping: URLToScreenMapping<S>
        screenToStackMapping: ScreenToStackMapping<S>
        toURLParams?: (params: Params[keyof S]) => URLSearchParams
    }) {
        history.scrollRestoration = "manual"

        this._screenToURLMapping = screenToURLMapping
        this._toURLParams = toURLParams
        this._urlToScreenMapping = urlToScreenMapping
        this._screenToStackMapping = screenToStackMapping

        window.addEventListener("popstate", (e: PopStateEvent) => {
            if (!e.state) {
                return
            }
            let { screen, params, index, stack, restore, _absoluteIndex } =
                e.state as NavgationState<S, Restore> & { _absoluteIndex: number }

            let lastIndex = this._currentIndex
            this._currentIndex = _absoluteIndex
            requestAnimationFrame(() => {
                if (lastIndex < this._currentIndex) {
                    this._onPush?.({ screen, params, index, stack, restore })
                    if (__ENABLE_DEVTOOLS__) {
                        requestAnimationFrame(() => {
                            performance.mark("navigation:push", {
                                detail: {
                                    ...e.state,
                                    url: window.location.href,
                                },
                            })
                        })
                    }
                } else {
                    this._onPop?.({ screen, params, index, stack, restore })

                    if (__ENABLE_DEVTOOLS__) {
                        requestAnimationFrame(() => {
                            performance.mark("navigation:pop", {
                                detail: {
                                    ...e.state,
                                    url: window.location.href,
                                },
                            })
                        })
                    }
                }
            })
        })
    }

    init(state: NavgationState<S, Restore>): NavgationState<S, Restore> {
        let currentURL = new URL(window.location.href)
        let mapped = this._urlToScreenMapping(currentURL)

        let initial: NavgationState<S, Restore> & { _absoluteIndex: number } = {
            ...state,
            _absoluteIndex: this._currentIndex,
        }
        let current = window.history.state as NavgationState<S, Restore>
        if (current) {
            initial = { ...initial, ...current }
        }

        initial.screen = mapped?.screen ?? initial.screen
        initial.stack = (mapped?.stack as unknown as typeof initial.stack) ?? initial.stack

        if (mapped?.params) {
            initial.params = {
                ...initial.params,
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

        return initial
    }

    public get length(): number {
        return this._currentIndex - this._initalLength
    }

    public push(
        next: Omit<NavgationState<S, Restore>, "stack" | "index">,
    ): NavgationState<S, Restore> {
        let current = window.history.state ?? {}

        let stack = this._screenToStackMapping[next.screen] as S[typeof next.screen]["stack"]

        let nextScreen: NavgationState<S, Restore> & { _absoluteIndex: number } = {
            ...next,
            restore: {},
            index: stack === current.stack ? current.index + 1 : 0,
            stack,
            _absoluteIndex: this._currentIndex + 1,
        }

        window.history.replaceState(
            {
                ...current,
                restore: next.restore,
            } satisfies NavgationState<S, Restore>,
            "",
            window.location.href,
        )

        let nextURL = this.nextURL(
            (this._screenToURLMapping[next.screen] ?? next.screen) as string,
            next.params as Params[keyof S],
        )

        window.history.pushState(nextScreen, "", nextURL)
        this._currentIndex++

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

        return nextScreen
    }

    public pop(n?: number): Promise<NavgationState<S, Restore>> {
        let { promise, resolve } = Promise.withResolvers<NavgationState<S, Restore>>()
        if (n) {
            window.history.go(-n)
        } else {
            window.history.back()
        }

        let trace: { stack: typeof Error.prototype.stack } = { stack: "" }
        if (__ENABLE_DEVTOOLS__) {
            Error.captureStackTrace(trace)
        }

        requestAnimationFrame(() => {
            this._currentIndex = window.history.state._absoluteIndex
            let state = window.history.state as NavgationState<S, Restore>

            if (__ENABLE_DEVTOOLS__) {
                let state = window.history.state as NavgationState<S, Restore>

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

        return promise
    }

    public replace(
        next: Omit<NavgationState<S, Restore>, "stack" | "index">,
    ): NavgationState<S, Restore> {
        let current = window.history.state ?? {}

        let stack = this._screenToStackMapping[next.screen] as S[typeof next.screen]["stack"]

        let nextScreen: NavgationState<S, Restore> & { _absoluteIndex: number } = {
            screen: next.screen,
            params: next.params,
            restore: current?.restore ?? {},
            index: stack === current.stack ? current.index + 1 : 0,
            stack,
            _absoluteIndex: this._currentIndex,
        }

        let nextURL = this.nextURL(
            (this._screenToURLMapping[next.screen] ?? next.screen) as string,
            next.params as Params[keyof S],
        )

        window.history.replaceState(nextScreen, "", nextURL)

        if (__ENABLE_DEVTOOLS__) {
            let trace: { stack: typeof Error.prototype.stack } = { stack: "" }
            Error.captureStackTrace(trace)
            performance.mark("navigation:replace", {
                detail: {
                    ...nextScreen,
                    url: nextURL.toString(),
                    trace: trace.stack,
                },
            })
        }

        this._onReplace?.(nextScreen)

        return nextScreen
    }

    addEventListener(event: "pop", handler: (next: NavgationState<S, Restore>) => void): () => void
    addEventListener(
        event: "push",
        handler: (next: NavgationState<S, Restore>, prev?: NavgationState<S, Restore>) => void,
    ): () => void
    addEventListener(
        event: "replace",
        handler: (next: NavgationState<S, Restore>) => void,
    ): () => void
    addEventListener(
        event: "pop" | "push" | "replace",
        handler: (next: NavgationState<S, Restore>, prev?: NavgationState<S, Restore>) => void,
    ): () => void {
        switch (event) {
            case "pop": {
                let onPopState = (e: PopStateEvent) => {
                    if (!e.state) {
                        return
                    }
                    let { screen, params, index, stack, restore } = e.state as NavgationState<
                        S,
                        Restore
                    >
                    handler({ screen, params, index, stack, restore })
                }
                window.addEventListener("popstate", onPopState)
                return () => window.removeEventListener("popstate", onPopState)
            }
            case "push": {
                this._onPush = handler
                return () => {
                    this._onPush = undefined
                }
            }
            case "replace": {
                this._onReplace = handler
                return () => {
                    this._onReplace = undefined
                }
            }
            default:
                throw new Error(`unknown event ${event}`)
        }
    }

    private nextURL(path: string, params: Params[keyof S]): URL {
        let nextURL = new URL(path, window.location.href)
        if (this._toURLParams) {
            let asURLParams = this._toURLParams(params)
            for (let [key, value] of asURLParams) {
                nextURL.searchParams.set(key, value)
            }
        } else {
            for (let key in params) {
                nextURL.searchParams.set(key, `${params[key]}`)
            }
        }

        return nextURL
    }
}

export type ScreenToURLMapping<S extends Screens> = Record<keyof S, string>

export type URLToScreenMapping<S extends Screens, K extends keyof S = keyof S> = (
    s: URL,
) => { screen: K; stack: S[K]["stack"]; params: S[K]["params"] } | undefined
