import { getThreadName } from "../thread"
import type { NavigationBackend } from "./NavigationBackend"
import type { NavgationState } from "./NavigationState"
import type { Screens, ScreenToStackMapping } from "./Screens"

export type RemoteNavigationPushMessage<
    S extends Screens,
    Restore extends Record<string, unknown>,
> = {
    type: "navigation:push"
    next: NavgationState<S, Restore>
}

declare const __LOG_LEVEL__: string

export class RemoteNavigationBackend<S extends Screens, Restore extends Record<string, unknown>>
    implements NavigationBackend<S, Restore>
{
    private _postMessage: (message: any, options?: StructuredSerializeOptions) => void
    private _screenToStackMapping: ScreenToStackMapping<S>

    constructor(
        postMessage: (message: any, options?: StructuredSerializeOptions) => void,
        screenToStackMapping: ScreenToStackMapping<S>,
    ) {
        this._postMessage = postMessage
        this._screenToStackMapping = screenToStackMapping
    }

    init(_: NavgationState<S, Restore>): NavgationState<S, Restore> {
        throw new Error("init is not available on RemoteNavigationBackend")
    }

    public get length(): number {
        return 0
    }

    public push(
        next: Omit<NavgationState<Screens, Restore>, "stack" | "index">,
    ): NavgationState<S, Restore> {
        if (__LOG_LEVEL__ === "debug") {
            console.debug(`==> [${getThreadName()}] navigation:push`, next)
        }

        let stack = this._screenToStackMapping[next.screen] as S[typeof next.screen]["stack"]

        let nextScreen: NavgationState<S, Restore> = {
            ...next,
            restore: {},
            index: 0,
            stack,
        }

        this._postMessage({
            type: "navigation:push",
            next: nextScreen,
        } satisfies RemoteNavigationPushMessage<S, Restore>)

        return nextScreen
    }

    public async pop(_?: number): Promise<NavgationState<S, Restore>> {
        throw new Error("pop is not available on RemoteNavigationBackend")
    }

    public replace(
        _: Omit<NavgationState<S, Restore>, "stack" | "index">,
    ): NavgationState<S, Restore> {
        throw new Error("replace is not available on RemoteNavigationBackend")
    }

    addEventListener(
        _event: "pop" | "push" | "replace",
        _handler: (next: NavgationState<S, Restore>, prev?: NavgationState<S, Restore>) => void,
    ): () => void {
        return () => {}
    }
}

export function navigationEventHandler<S extends Screens, Restore extends Record<string, unknown>>(
    cb: (next: NavgationState<S, Restore>) => void,
) {
    return (evt: MessageEvent<RemoteNavigationPushMessage<S, Restore>>) => {
        let msg = evt.data
        if (msg?.type === "navigation:push") {
            evt.stopImmediatePropagation()
            cb(msg.next)
            return
        }
    }
}
