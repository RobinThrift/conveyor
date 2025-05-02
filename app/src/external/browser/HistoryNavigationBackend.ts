import type {
    NavgationState,
    NavigationBackend,
    OnPop,
    OnPush,
    Screens,
} from "@/lib/navigation"

export class HistoryNavigationBackend<
    S extends Screens,
    Params extends Record<string, unknown>,
    Restore extends Record<string, unknown>,
> implements NavigationBackend<S, Restore>
{
    private _onPush?: OnPush<S, Restore>
    private _onPop?: OnPop<S, Restore>
    private _toURLParams?: (params: Params) => URLSearchParams
    private _fromURLParams?: (params: URLSearchParams) => Params
    private _screenToURLMapping: ScreenToURLMapping<S>
    private _urlToScreenMapping: URLToScreenMapping<ScreenToURLMapping<S>>

    private _currLength = window.history.length

    constructor({
        screenToURLMapping,
        toURLParams,
        fromURLParams,
    }: {
        screenToURLMapping: ScreenToURLMapping<S>
        toURLParams?: (params: Params) => URLSearchParams
        fromURLParams?: (params: URLSearchParams) => Params
    }) {
        this._screenToURLMapping = screenToURLMapping
        this._toURLParams = toURLParams
        this._fromURLParams = fromURLParams
        this._urlToScreenMapping = {} as URLToScreenMapping<
            ScreenToURLMapping<S>
        >

        for (let screen in screenToURLMapping) {
            let k: keyof URLToScreenMapping<ScreenToURLMapping<S>> = screen
            this._urlToScreenMapping[k] = screen as URLToScreenMapping<
                ScreenToURLMapping<S>
            >[typeof k]
        }

        window.addEventListener("popstate", (e: PopStateEvent) => {
            if (!e.state) {
                return
            }
            let { screen, index, stack, restore } = e.state as NavgationState<
                S,
                keyof S,
                Restore
            >

            let lastLength = this._currLength
            this._currLength = window.history.length
            requestAnimationFrame(() => {
                if (lastLength > window.history.length) {
                    this._onPush?.({ screen, index, stack, restore })
                } else {
                    this._onPop?.({ screen, index, stack, restore })
                }
            })
        })
    }

    init(
        state: NavgationState<S, keyof S, Restore>,
    ): NavgationState<S, keyof S, Restore> {
        let next = state
        let current = window.history.state as NavgationState<
            S,
            keyof S,
            Restore
        >
        if (current) {
            next = { ...next, ...current }
        }

        if (!current || !current.screen?.name) {
            let currentURL = new URL(window.location.href)
            let mapped =
                this._urlToScreenMapping[
                    currentURL.pathname as keyof URLToScreenMapping<
                        ScreenToURLMapping<S>
                    >
                ]
            next.screen.name = (mapped ?? next.screen.name) as keyof S
        }

        if (this._fromURLParams) {
            let currentURL = new URL(window.location.href)
            let params = this._fromURLParams(currentURL.searchParams)
            next.screen.params = { ...next.screen.params, ...params }
        }

        if (import.meta.env.VITE_USE_HASH_HISTORY) {
            try {
                let hash = JSON.parse(
                    decodeURIComponent(window.location.hash).substring(1),
                )

                let mapped =
                    this._urlToScreenMapping[
                        hash.path as keyof URLToScreenMapping<
                            ScreenToURLMapping<S>
                        >
                    ]
                next.screen.name = (mapped ?? next.screen.name) as keyof S

                next.screen.params = { ...next.screen.params, ...hash.params }
            } catch {
                //ignore errors
            }
        }

        window.history.replaceState(next, "", window.location.href)
        return next
    }

    public push(
        next: NavgationState<S, keyof S, Restore>,
    ): NavgationState<S, keyof S, Restore> {
        let current = window.history.state ?? {}
        let nextScreen: NavgationState<S, keyof S, Restore> = {
            ...next,
            restore: {},
        }

        window.history.replaceState(
            {
                ...current,
                restore: next.restore,
            } satisfies NavgationState<S, keyof S, Restore>,
            "",
            window.location.href,
        )

        let nextURL = this.nextURL(
            (this._screenToURLMapping[next.screen.name] ??
                next.screen.name) as string,
            next.screen.params as Params,
        )

        window.history.pushState(nextScreen, "", nextURL)

        this._currLength = window.history.length

        return nextScreen
    }

    public pop(n?: number): Promise<NavgationState<S, keyof S, Restore>> {
        let { promise, resolve } =
            Promise.withResolvers<NavgationState<S, keyof S, Restore>>()
        if (n) {
            window.history.go(-n)
        } else {
            window.history.back()
        }

        requestAnimationFrame(() => {
            this._currLength = window.history.length
            let state = window.history.state as NavgationState<
                S,
                keyof S,
                Restore
            >
            resolve(state)
        })

        return promise
    }

    addEventListener(
        event: "pop",
        handler: (next: NavgationState<S, keyof S, Restore>) => void,
    ): () => void
    addEventListener(
        event: "push",
        handler: (
            next: NavgationState<S, keyof S, Restore>,
            prev?: NavgationState<S, keyof S, Restore>,
        ) => void,
    ): () => void
    addEventListener(
        event: "pop" | "push",
        handler: (
            next: NavgationState<S, keyof S, Restore>,
            prev?: NavgationState<S, keyof S, Restore>,
        ) => void,
    ): () => void {
        switch (event) {
            case "pop": {
                let onPopState = (e: PopStateEvent) => {
                    if (!e.state) {
                        return
                    }
                    let { screen, index, stack, restore } =
                        e.state as NavgationState<S, keyof S, Restore>
                    handler({ screen, index, stack, restore })
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

    private nextURL(path: string, params: Params): URL {
        if (import.meta.env.VITE_USE_HASH_HISTORY) {
            let nextURL = new URL(window.location.href)
            let hash = JSON.stringify({
                path,
                params,
            })
            nextURL.hash = encodeURIComponent(hash)
            return nextURL
        }

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

export type URLToScreenMapping<T extends Record<keyof T, keyof any>> = {
    [K in keyof T as T[K]]: K
}
