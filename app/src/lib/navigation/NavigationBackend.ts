import type { NavgationState, Screens } from "./NavigationState"

export type OnPush<
    S extends Screens,
    Stacks extends string,
    Restore extends Record<string, unknown>,
    Name extends keyof S = keyof S,
    Prev extends keyof S = keyof S,
> = (
    current: NavgationState<S, Stacks, Restore, Name>,
    prev?: NavgationState<S, Stacks, Restore, Prev>,
) => void

export type OnPop<
    S extends Screens,
    Stacks extends string,
    Restore extends Record<string, unknown>,
    Name extends keyof S = keyof S,
    Prev extends keyof S = keyof S,
> = (
    current: NavgationState<S, Stacks, Restore, Name>,
    prev?: NavgationState<S, Stacks, Restore, Prev>,
) => void

export interface NavigationBackend<
    S extends Screens,
    Stacks extends string,
    Restore extends Record<string, unknown>,
> {
    init(state: NavgationState<S, Stacks, Restore>): NavgationState<S, Stacks, Restore>

    push(next: NavgationState<S, Stacks, Restore>): NavgationState<S, Stacks, Restore>
    pop(n?: number): Promise<NavgationState<S, Stacks, Restore>>

    addEventListener(
        event: "push",
        handler: (next: NavgationState<S, Stacks, Restore>) => void,
    ): () => void

    addEventListener(
        event: "pop",
        handler: (next: NavgationState<S, Stacks, Restore>) => void,
    ): () => void
}
