import type { Screens } from "./Screens"

export type NavgationState<S extends Screens, Name extends keyof S = keyof S> = {
    screen: Name
    params: S[Name]["params"]
    stack: S[Name]["stack"]
}
