import type { NavgationState } from "./NavigationState"
import type { Screens } from "./Screens"

export type OnPush<S extends Screens> = (
    current: NavgationState<S>,
    prev?: NavgationState<S>,
) => void

export type OnPop<S extends Screens> = (
    current: NavgationState<S>,
    prev?: NavgationState<S>,
) => void

// export type OnReplace<S extends Screens> = (current: NavgationState<S>) => void

export interface NavigationBackend<S extends Screens> {
    init(state: NavgationState<S>): NavgationState<S>

    push(next: Omit<NavgationState<Screens>, "stack">): NavgationState<S>

    pop(): Promise<NavgationState<S>>

    // replace(next: Omit<NavgationState<Screens>, "stack">): NavgationState<S>

    addEventListener(event: "push", handler: (next: NavgationState<S>) => void): () => void

    addEventListener(event: "pop", handler: (next: NavgationState<S>) => void): () => void

    // addEventListener(event: "replace", handler: (next: NavgationState<S>) => void): () => void
}
