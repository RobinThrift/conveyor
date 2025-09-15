import type { Screens } from "./Screens"

export type NavgationState<
    S extends Screens,
    Restore extends Record<string, unknown>,
    Name extends keyof S = keyof S,
> = {
    screen: Name
    params: S[Name]["params"]
    index: number
    stack: S[Name]["stack"]
    restore: Partial<Restore>
}
