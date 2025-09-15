import {
    filterFromSearchParams,
    filterToSearchParams,
    type MemoID,
    type ListMemosQuery as MemoListFilter,
} from "@/domain/Memo"
import { isEqual } from "@/lib/isEqual"
import type {
    InferParams,
    InferStacks,
    NavgationState,
    NavigationBackend,
    OnPop,
    OnPush,
    ScreenToStackMapping,
} from "@/lib/navigation"

export type Screens = {
    root: {
        stack: "default"
        params: {
            filter?: MemoListFilter
        }
    }
    "memo.view": {
        stack: "single-memo"
        params: {
            memoID?: MemoID
            filter?: MemoListFilter
        }
    }
    "memo.edit": {
        stack: "edit-memo"
        params: {
            memoID?: MemoID
            filter?: MemoListFilter
            isEditing?: boolean
            editPosition?: { x: number; y: number; snippet?: string }
        }
    }
    "memo.new": {
        stack: "new-memo"
        // biome-ignore lint/complexity/noBannedTypes: this is intentional to prevent params from being undefined
        params: {}
    }
    settings: {
        stack: "settings"
        params: {
            tab?: string
        }
    }
    unlock: {
        stack: "default"
        // biome-ignore lint/complexity/noBannedTypes: this is intentional to prevent params from being undefined
        params: {}
    }
    setup: {
        stack: "default"
        // biome-ignore lint/complexity/noBannedTypes: this is intentional to prevent params from being undefined
        params: {}
    }
}

export type Params = InferParams<Screens>

export type Stacks = InferStacks<Screens>

export type Restore = {
    scrollOffsetTop: number
}

export class NavigationController {
    private _backend: NavigationBackend<Screens, Restore>
    private _onPush?: OnPush<Screens, Restore>
    private _onPop?: OnPop<Screens, Restore>

    private _currentState: NavgationState<Screens, Restore> = {
        screen: "root",
        params: {},
        stack: "default",
        index: 0,
        restore: { scrollOffsetTop: 0 },
    }

    private _lastState?: NavgationState<Screens, Restore> = undefined

    constructor({
        backend,
    }: {
        backend: NavigationBackend<Screens, Restore>
    }) {
        this._backend = backend

        backend.addEventListener("push", (current) => {
            this._onPush?.(current, this._currentState)
            this._currentState = { ...current }
        })

        backend.addEventListener("pop", (current) => {
            this._onPop?.(current, this._lastState)
            this._currentState = { ...current }
        })
    }

    public init(): NavgationState<Screens, Restore> {
        this._currentState = this._backend.init(this._currentState)
        return this._currentState
    }

    public updateParams<S extends keyof Screens>(params: Partial<Params[S]>) {
        this.push({
            ...this._currentState,
            params: {
                ...this._currentState.params,
                ...params,
            },
        })
    }

    public push(next: Omit<NavgationState<Screens, Restore>, "stack" | "index">) {
        if (
            this._currentState.screen === next.screen &&
            isEqual(next.params, this._currentState.params)
        ) {
            return
        }

        let nextState = this._backend.push(next)
        let current = this._currentState
        requestAnimationFrame(() => {
            this._onPush?.(nextState, current)
        })

        this._currentState = nextState
    }

    public async pop(): Promise<void> {
        this._lastState = this._currentState
        let next = await this._backend.pop()
        this._currentState = { ...next }
    }

    public async popStack(): Promise<void> {
        if (this._currentState.stack === "default") {
            return
        }
        if (this._backend.length <= 1) {
            this.push({
                screen: "root",
                params: {},
                restore: { scrollOffsetTop: 0 },
            })
            return
        }

        this._lastState = this._currentState
        let next = await this._backend.pop(this._currentState.index + 1)
        this._currentState = { ...next }
    }

    addEventListener(event: "pop", handler: OnPop<Screens, Restore>): void
    addEventListener(event: "push", handler: OnPush<Screens, Restore>): void
    addEventListener(
        event: "pop" | "push",
        handler: (
            next: NavgationState<Screens, Restore>,
            prev?: NavgationState<Screens, Restore>,
        ) => void,
    ) {
        switch (event) {
            case "pop":
                this._onPop = handler
                return
            case "push":
                this._onPush = handler
                return
            default:
                throw new Error(`unknown event ${event}`)
        }
    }

    static toURLParams(params: Params[keyof Screens]): URLSearchParams {
        let urlParams = new URLSearchParams()

        if (!params) {
            return urlParams
        }

        if ("filter" in params) {
            urlParams = filterToSearchParams(params.filter ?? {})
        }

        if ("memoID" in params && params.memoID) {
            urlParams.set("memo", params.memoID)
        }

        if ("isEditing" in params && params.isEditing) {
            urlParams.set("isEditing", params.isEditing.toString())
        }

        if ("editPosition" in params && params.editPosition) {
            urlParams.set("editPosition", encodeURIComponent(JSON.stringify(params.editPosition)))
        }

        if ("tab" in params && params.tab) {
            urlParams.set("tab", params.tab)
        }

        return urlParams
    }

    public static screenToURLMapping = {
        "memo.edit": "/",
        "memo.view": "/",
        "memo.new": "/memos/new",
        settings: "/settings",
        unlock: "/unlock",
        setup: "/setup",
        root: "/",
    }

    public static screenToStackMapping: ScreenToStackMapping<Screens> = {
        "memo.edit": "edit-memo",
        "memo.view": "single-memo",
        "memo.new": "new-memo",
        settings: "settings",
        unlock: "default",
        setup: "default",
        root: "default",
    }

    public static urlToScreenMapping = <S extends keyof Screens>(
        url: URL,
    ): { screen: S; params: Params[S]; stack: Screens[S]["stack"] } | undefined => {
        switch (url.pathname) {
            case "/memos/new":
                return {
                    screen: "memo.new" as S,
                    stack: "single-memo",
                    params: fromURLParams<S>(url.searchParams),
                }
            case "/settings":
                return {
                    screen: "settings" as S,
                    stack: "settings",
                    params: fromURLParams<S>(url.searchParams),
                }
            case "/setup":
                return { screen: "setup" as S, stack: "default", params: {} }
            case "/unlock":
                return { screen: "unlock" as S, stack: "default", params: {} }
        }

        let hasMemo = url.searchParams.has("memo") && url.searchParams.get("memo")?.length !== 0
        let hasIsEditing = url.searchParams.get("isEditing") === "true"

        if (hasMemo && hasIsEditing) {
            return {
                screen: "memo.edit" as S,
                stack: "single-memo",
                params: fromURLParams<S>(url.searchParams),
            }
        }

        if (hasMemo) {
            return {
                screen: "memo.view" as S,
                stack: "single-memo",
                params: fromURLParams<S>(url.searchParams),
            }
        }

        return {
            screen: "root" as S,
            stack: "default",
            params: fromURLParams<S>(url.searchParams),
        }
    }
}

function fromURLParams<S extends keyof Screens>(urlParams: URLSearchParams): Params[S] {
    let params = {
        filter: filterFromSearchParams(urlParams),
    } as Params[S]

    let memoID = urlParams.get("memo")
    if (memoID) {
        ;(params as Params["memo.view"]).memoID = memoID
    }

    let isEditing = urlParams.get("isEditing") === "true"
    if (isEditing) {
        ;(params as Params["memo.edit"]).isEditing = isEditing
    }

    let editPosition = urlParams.get("editPosition")
    if (editPosition) {
        ;(params as Params["memo.edit"]).isEditing = JSON.parse(decodeURIComponent(editPosition))
    }

    let tab = urlParams.get("tab")
    if (tab) {
        ;(params as Params["settings"]).tab = tab
    }

    return params
}
