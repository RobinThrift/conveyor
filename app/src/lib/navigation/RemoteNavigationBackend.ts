import { getThreadName } from "../thread"
import type { NavigationBackend } from "./NavigationBackend"
import type { NavgationState, Screens } from "./NavigationState"

export type RemoteNavigationPushMessage<
    S extends Screens,
    Restore extends Record<string, unknown>,
> = {
    type: "navigation:push"
    next: NavgationState<S, keyof S, Restore>
}

declare const __LOG_LEVEL__: string

export class RemoteNavigationBackend<
    S extends Screens,
    Restore extends Record<string, unknown>,
> implements NavigationBackend<S, Restore>
{
    private _postMessage: (
        message: any,
        options?: StructuredSerializeOptions,
    ) => void

    constructor(
        postMessage: (
            message: any,
            options?: StructuredSerializeOptions,
        ) => void,
    ) {
        this._postMessage = postMessage
    }

    init(
        _: NavgationState<S, keyof S, Restore>,
    ): NavgationState<S, keyof S, Restore> {
        throw new Error("init is not available on RemoteNavigationBackend")
    }

    public push(
        next: NavgationState<S, keyof S, Restore>,
    ): NavgationState<S, keyof S, Restore> {
        if (__LOG_LEVEL__ === "debug") {
            console.debug(`==> [${getThreadName()}] navigation:push`, next)
        }
        this._postMessage({
            type: "navigation:push",
            next,
        } satisfies RemoteNavigationPushMessage<S, Restore>)
        return next
    }

    public async pop(_?: number): Promise<NavgationState<S, keyof S, Restore>> {
        throw new Error("pop is not available on RemoteNavigationBackend")
    }

    addEventListener(
        _event: "pop" | "push",
        _handler: (
            next: NavgationState<S, keyof S, Restore>,
            prev?: NavgationState<S, keyof S, Restore>,
        ) => void,
    ): () => void {
        return () => {}
    }
}

export function navigationEventHandler<
    S extends Screens,
    Restore extends Record<string, unknown>,
>(cb: (next: NavgationState<S, keyof S, Restore>) => void) {
    return (evt: MessageEvent<RemoteNavigationPushMessage<S, Restore>>) => {
        let msg = evt.data
        if (msg?.type === "navigation:push") {
            evt.stopImmediatePropagation()
            cb(msg.next)
            return
        }
    }
}
