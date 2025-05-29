export type Screens = Record<string, Record<string, unknown>>

export type NavgationState<
    S extends Screens,
    Stacks extends string,
    Restore extends Record<string, unknown>,
    Name extends keyof S = keyof S,
> = {
    screen: {
        name: Name
        params: S[Name]
    }
    index: number
    stack: Stacks
    restore: Partial<Restore>
}
