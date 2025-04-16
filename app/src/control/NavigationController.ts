import {
    type MemoID,
    type ListMemosQuery as MemoListFilter,
    filterFromSearchParams,
    filterToSearchParams,
} from "@/domain/Memo"
import { isEqual } from "@/lib/isEqual"
import type {
    NavgationState,
    NavigationBackend,
    OnPop,
    OnPush,
} from "@/lib/navigation"

export type Screens = {
    root: {
        filter?: MemoListFilter
    }
    "memo.view": {
        memoID?: MemoID
        filter?: MemoListFilter
    }
    "memo.edit": {
        memoID?: MemoID
        filter?: MemoListFilter
        isEditing?: boolean
        editPosition?: { x: number; y: number; snippet?: string }
    }
    "memo.new": never
    settings: {
        tab?: string
    }
    unlock: never
    setup: never
}

export type Params = Screens[keyof Screens]

export type Restore = {
    scrollOffsetTop: number
}

export class NavigationController {
    private _backend: NavigationBackend<Screens, Restore>
    private _onPush?: OnPush<Screens, Restore>
    private _onPop?: OnPop<Screens, Restore>

    private _currentState: NavgationState<Screens, keyof Screens, Restore> = {
        screen: {
            name: "root",
            params: {},
        },
        restore: { scrollOffsetTop: 0 },
    }

    private _lastState?: NavgationState<Screens, keyof Screens, Restore> =
        undefined

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

    public init(): NavgationState<Screens, keyof Screens, Restore> {
        this._currentState = this._backend.init(this._currentState)
        return this._currentState
    }

    public updateParams<S extends keyof Screens>(params: Partial<Screens[S]>) {
        this.push({
            ...this._currentState,
            screen: {
                ...this._currentState.screen,
                params: {
                    ...this._currentState.screen.params,
                    ...params,
                },
            },
        })
    }

    public push(next: NavgationState<Screens, keyof Screens, Restore>) {
        if (isEqual(next.screen, this._currentState.screen)) {
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

    addEventListener(event: "pop", handler: OnPop<Screens, Restore>): void
    addEventListener(event: "push", handler: OnPush<Screens, Restore>): void
    addEventListener(
        event: "pop" | "push",
        handler: (
            next: NavgationState<Screens, keyof Screens, Restore>,
            prev?: NavgationState<Screens, keyof Screens, Restore>,
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

    static fromURLParams(urlParams: URLSearchParams): Params {
        let params: Params = {
            filter: filterFromSearchParams(urlParams),
        }

        let memoID = urlParams.get("memo")
        if (memoID) {
            ;(params as Screens["memo.view"]).memoID = memoID
        }

        let isEditing = urlParams.get("isEditing") === "true"
        if (isEditing) {
            ;(params as Screens["memo.edit"]).isEditing = isEditing
        }

        let editPosition = urlParams.get("editPosition")
        if (editPosition) {
            ;(params as Screens["memo.edit"]).isEditing = JSON.parse(
                decodeURIComponent(editPosition),
            )
        }

        let tab = urlParams.get("tab")
        if (tab) {
            ;(params as Screens["settings"]).tab = tab
        }

        return params
    }

    static toURLParams(params: Params): URLSearchParams {
        let urlParams: URLSearchParams
        if ("filter" in params) {
            urlParams = filterToSearchParams(params.filter ?? {})
        } else {
            urlParams = new URLSearchParams()
        }

        if ("memoID" in params && params.memoID) {
            urlParams.set("memo", params.memoID)
        }

        if ("isEditing" in params && params.isEditing) {
            urlParams.set("isEditing", params.isEditing.toString())
        }

        if ("editPosition" in params && params.editPosition) {
            urlParams.set(
                "editPosition",
                encodeURIComponent(JSON.stringify(params.editPosition)),
            )
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
}
