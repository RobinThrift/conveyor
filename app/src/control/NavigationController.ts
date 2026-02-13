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
}
