export type Screens = Record<string, Record<string, unknown>>

export type NavgationState<
    S extends Screens,
    Name extends keyof S,
    Restore extends Record<string, unknown>,
> = {
    screen: {
        name: Name
        params: S[Name]
    }
    index: number
    stack: number
    restore: Partial<Restore>
}
