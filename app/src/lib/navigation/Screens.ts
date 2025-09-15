export type Screens<Stacks extends string = string> = Record<string, Screen<Stacks, any>>

export type Screen<Stack extends string, Params extends Record<string, any>> = {
    params: Params
    stack: Stack
}

export type InferStacks<S extends Screens> = S[keyof S]["stack"]

export type ScreenToStackMapping<S extends Screens> = {
    [K in keyof S]: S[K]["stack"]
}

export type InferParams<S> = S extends Screens
    ? {
          [K in keyof S]: S[K]["params"]
      }
    : never
