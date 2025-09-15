import type {
    NavgationState,
    NavigationBackend,
    OnPop,
    OnPush,
    Screens,
    ScreenToStackMapping,
} from "@/lib/navigation"

export class HistoryNavigationBackend<
    S extends Screens,
    Params extends Record<keyof S, Record<string, unknown>>,
    Restore extends Record<string, unknown>,
> implements NavigationBackend<S, Restore>
{
    private _onPush?: OnPush<S, Restore>
    private _onPop?: OnPop<S, Restore>
    private _toURLParams?: (params: Params[keyof S]) => URLSearchParams
    private _screenToURLMapping: ScreenToURLMapping<S>
    private _urlToScreenMapping: URLToScreenMapping<S>
    private _screenToStackMapping: ScreenToStackMapping<S>

    private _currLength = window.history.length

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
            let { screen, params, index, stack, restore } = e.state as NavgationState<S, Restore>

            let lastLength = this._currLength
            this._currLength = window.history.length
            requestAnimationFrame(() => {
                if (lastLength > window.history.length) {
                    this._onPush?.({ screen, params, index, stack, restore })
                } else {
                    this._onPop?.({ screen, params, index, stack, restore })
                }
            })
        })
    }

    init(state: NavgationState<S, Restore>): NavgationState<S, Restore> {
        let currentURL = new URL(window.location.href)
        let mapped = this._urlToScreenMapping(currentURL)

        let initial = state
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
        return initial
    }

    public get length(): number {
        return window.history.length - 1
    }

    public push(
        next: Omit<NavgationState<S, Restore>, "stack" | "index">,
    ): NavgationState<S, Restore> {
        let current = window.history.state ?? {}

        let stack = this._screenToStackMapping[next.screen] as S[typeof next.screen]["stack"]

        let nextScreen: NavgationState<S, Restore> = {
            ...next,
            restore: {},
            index: stack === current.stack ? current.index + 1 : 0,
            stack,
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

        this._currLength = window.history.length

        return nextScreen
    }

    public pop(n?: number): Promise<NavgationState<S, Restore>> {
        let { promise, resolve } = Promise.withResolvers<NavgationState<S, Restore>>()
        if (n) {
            window.history.go(-n)
        } else {
            window.history.back()
        }

        requestAnimationFrame(() => {
            this._currLength = window.history.length
            let state = window.history.state as NavgationState<S, Restore>
            resolve(state)
        })

        return promise
    }

    addEventListener(event: "pop", handler: (next: NavgationState<S, Restore>) => void): () => void
    addEventListener(
        event: "push",
        handler: (next: NavgationState<S, Restore>, prev?: NavgationState<S, Restore>) => void,
    ): () => void
    addEventListener(
        event: "pop" | "push",
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
