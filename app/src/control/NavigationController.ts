import type { MemoID } from "@/domain/Memo"
import { isEqual } from "@/lib/isEqual"
import type { InferParams, InferStacks, NavgationState, NavigationBackend } from "@/lib/navigation"

export type Screens = {
    list: {
        // biome-ignore lint/complexity/noBannedTypes: this is intentional to prevent params from being undefined
        params: {}
        stack: "main"
    }
    memos: {
        params: {
            ids: MemoID[]
            editPosition?: { x: number; y: number; snippet?: string }
        }
        stack: "memos"
    }
    settings: {
        // biome-ignore lint/complexity/noBannedTypes: this is intentional to prevent params from being undefined
        params: {}
        stack: "settings"
    }
    unlock: {
        // biome-ignore lint/complexity/noBannedTypes: this is intentional to prevent params from being undefined
        params: {}
        stack: "main"
    }
    setup: {
        // biome-ignore lint/complexity/noBannedTypes: this is intentional to prevent params from being undefined
        params: {}
        stack: "main"
    }
}

export type Params = InferParams<Screens>

export type Stacks = InferStacks<Screens>

export class NavigationController {
    private _backend: NavigationBackend<Screens>

    public currentState: NavgationState<Screens> = {
        screen: "list",
        stack: "main",
        params: {},
    }

    public addEventListener: NavigationBackend<Screens>["addEventListener"]

    constructor({
        backend,
    }: {
        backend: NavigationBackend<Screens>
    }) {
        this._backend = backend
        this.addEventListener = this._backend.addEventListener.bind(this._backend)
    }

    public init(): NavgationState<Screens> {
        this.currentState = this._backend.init(this.currentState)
        return this.currentState
    }

    public push(next: Omit<NavgationState<Screens>, "stack">) {
        if (
            this.currentState.screen === next.screen &&
            isEqual(next.params, this.currentState.params)
        ) {
            return
        }

        let nextState = this._backend.push(next)

        this.currentState = nextState
    }

    public async pop(): Promise<void> {
        let next = await this._backend.pop()
        this.currentState = { ...next }
    }

    // static toURLParams(params: Params[keyof Screens]): URLSearchParams {
    //     let urlParams = new URLSearchParams()
    //
    //     if (!params) {
    //         return urlParams
    //     }
    //
    //     if ("filter" in params) {
    //         urlParams = filterToSearchParams(params.filter ?? {})
    //     }
    //
    //     if ("memoID" in params && params.memoID) {
    //         urlParams.set("memo", params.memoID)
    //     }
    //
    //     if ("editPosition" in params && params.editPosition) {
    //         urlParams.set("editPosition", encodeURIComponent(JSON.stringify(params.editPosition)))
    //     }
    //
    //     if ("settings" in params && params.settings === "open") {
    //         urlParams.set("settings", "open")
    //     }
    //
    //     return urlParams
    // }

    // public static screenToURLMapping: Record<keyof Screens, string> = {
    //     unlock: "/unlock",
    //     setup: "/setup",
    //     list: "/",
    //     memo: "/memos",
    //     settings: "/settings",
    // }

    // public static mapURLToScreen = <K extends keyof Screens>(
    //     url: URL,
    // ): { screen: K; stack: Screens[K]["stack"]; params: Screens[K]["params"] } | undefined => {
    //     switch (url.pathname) {
    //         case NavigationController.screenToURLMapping.setup:
    //             return { screen: "setup", stack: "main", params: {} }
    //         case NavigationController.screenToURLMapping.unlock:
    //             return { screen: "unlock", stack: "main", params: {} }
    //         case NavigationController.screenToURLMapping.memo:
    //             return {
    //                 screen: "memo",
    //                 stack: "memos",
    //                 params: fromURLParams<"memo">(url.searchParams),
    //             }
    //         case NavigationController.screenToURLMapping.settings:
    //             return {
    //                 screen: "settings",
    //                 stack: "settings",
    //                 params: {},
    //             }
    //         case NavigationController.screenToURLMapping.list:
    //             return {
    //                 screen: "list",
    //                 stack: "main",
    //                 params: fromURLParams<"list">(url.searchParams),
    //             }
    //     }
    // }
}

// function fromURLParams<S extends keyof Screens>(urlParams: URLSearchParams): Params[S] {
//     let params = {
//         filter: filterFromSearchParams(urlParams),
//     } as Params[S]
//
//     let memoID = urlParams.get("memo")
//     if (memoID) {
//         ;(params as Params["main"]).memoID = memoID
//     }
//
//     let editPosition = urlParams.get("editPosition")
//     if (editPosition) {
//         ;(params as Params["main"]).editPosition = JSON.parse(decodeURIComponent(editPosition))
//     }
//
//     let settings = urlParams.get("settings")
//     if (settings === "open") {
//         ;(params as Params["main"]).settings = "open"
//     }
//
//     return params
// }
