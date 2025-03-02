export function getPath<
    T extends Record<string, unknown>,
    K extends KeyPaths<T>,
>(obj: T, path: K): ValueAt<T, K> {
    return getByKey(obj != null ? obj : {}, (path as string).split("."))
}

export function setPath<
    T extends Record<string, unknown>,
    K extends KeyPaths<T>,
>(obj: T, path: K, value: ValueAt<T, K>): T {
    return setByKey(
        obj != null ? obj : {},
        (path as string).split("."),
        value,
    ) as T
}

export function setByKey<T extends Record<string, unknown>>(
    obj: T,
    path: PropertyKey[],
    value: unknown,
): T {
    let copy = { ...obj }

    let [key, ...rest] = path
    if (path.length === 1) {
        if (value === undefined) {
            delete copy[key as keyof T]
        } else {
            copy[key as keyof T] = value as T[keyof T]
        }
        return copy
    }

    copy[key as keyof T] = setByKey(copy[key as keyof T] as any, rest, value)

    return copy
}

export function getByKey<
    T extends Record<string, unknown>,
    V extends T[keyof T],
>(obj: T, path: PropertyKey[]): V {
    let [key, ...rest] = path
    if (path.length === 1) {
        return obj[key as keyof T] as V
    }

    return getByKey(obj[key as keyof T] as any, rest)
}

export type KeyPaths<
    T extends Record<string, unknown>,
    P extends string = "",
    MaxDepth extends number = 10,
> = MaxDepth extends 0
    ? never
    : {
          [K in keyof T]-?: K extends string
              ?
                    | (T[K] extends Record<string, unknown>
                          ? KeyPaths<
                                T[K],
                                ConcatPath<P, K>,
                                Subtract<MaxDepth, 1>
                            >
                          : ConcatPath<P, K>)
                    | (P extends "" ? never : P)
              : never
      }[keyof T]

export type ValueAt<T, P> = T extends unknown
    ? NestedObjKey<T, P> extends never
        ? P extends keyof T
            ? T[P]
            : never
        : NestedObjKey<T, P>
    : never

export type KeyPath<
    T extends Record<string, unknown>,
    P,
> = P extends `${infer A}.${infer B}`
    ? A extends keyof T
        ? ValueAt<T[A], B>
        : never
    : never

type NestedObjKey<T, P> = P extends `${infer A}.${infer B}`
    ? A extends keyof T
        ? ValueAt<NonNullable<T[A]>, B>
        : never
    : never

type ConcatPath<T extends string, P extends string> = T extends ""
    ? P
    : `${T}.${P}`

type Length<T extends any[]> = T extends { length: infer L } ? L : never

type BuildTuple<L extends number, T extends any[] = []> = T extends {
    length: L
}
    ? T
    : BuildTuple<L, [...T, any]>

type Subtract<A extends number, B extends number> = BuildTuple<A> extends [
    ...infer U,
    ...BuildTuple<B>,
]
    ? Length<U>
    : never
