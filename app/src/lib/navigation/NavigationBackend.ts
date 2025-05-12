import type { NavgationState, Screens } from "./NavigationState"

export type OnPush<
    S extends Screens,
    Restore extends Record<string, unknown>,
    Name extends keyof S = keyof S,
    Prev extends keyof S = keyof S,
> = (
    current: NavgationState<S, Name, Restore>,
    prev?: NavgationState<S, Prev, Restore>,
) => void

export type OnPop<
    S extends Screens,
    Restore extends Record<string, unknown>,
    Name extends keyof S = keyof S,
    Prev extends keyof S = keyof S,
> = (
    current: NavgationState<S, Name, Restore>,
    prev?: NavgationState<S, Prev, Restore>,
) => void

export interface NavigationBackend<
    S extends Screens,
    Restore extends Record<string, unknown>,
> {
    init(
        state: NavgationState<S, keyof S, Restore>,
    ): NavgationState<S, keyof S, Restore>

    push(
        next: NavgationState<S, keyof S, Restore>,
    ): NavgationState<S, keyof S, Restore>
    pop(n?: number): Promise<NavgationState<S, keyof S, Restore>>

    addEventListener(
        event: "push",
        handler: (next: NavgationState<S, keyof S, Restore>) => void,
    ): () => void

    addEventListener(
        event: "pop",
        handler: (next: NavgationState<S, keyof S, Restore>) => void,
    ): () => void
}
