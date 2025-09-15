import type { NavgationState } from "./NavigationState"
import type { Screens } from "./Screens"

export type OnPush<S extends Screens, Restore extends Record<string, unknown>> = (
    current: NavgationState<S, Restore>,
    prev?: NavgationState<S, Restore>,
) => void

export type OnPop<S extends Screens, Restore extends Record<string, unknown>> = (
    current: NavgationState<S, Restore>,
    prev?: NavgationState<S, Restore>,
) => void

export interface NavigationBackend<S extends Screens, Restore extends Record<string, unknown>> {
    init(state: NavgationState<S, Restore>): NavgationState<S, Restore>

    push(
        next: Omit<NavgationState<Screens, Restore>, "stack" | "index">,
    ): NavgationState<S, Restore>
    pop(n?: number): Promise<NavgationState<S, Restore>>

    length: number

    addEventListener(event: "push", handler: (next: NavgationState<S, Restore>) => void): () => void

    addEventListener(event: "pop", handler: (next: NavgationState<S, Restore>) => void): () => void
}
