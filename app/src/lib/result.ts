import { isCustomErrType } from "./errors"

export type Result<T, E extends Error = Error> =
    | readonly [T, never]
    | readonly [never, E]

export type AsyncResult<T, E extends Error = Error> = Promise<Result<T, E>>

export function fromThrowing<T, E extends Error = Error>(
    fn: () => T,
): Result<T, E> {
    try {
        return Object.freeze([fn(), undefined as never])
    } catch (e) {
        return Object.freeze([undefined as never, e as E])
    }
}

export async function fromPromise<T, E extends Error = Error>(
    p: PromiseLike<T>,
): AsyncResult<T, E> {
    try {
        return Object.freeze([await p, undefined as never])
    } catch (e) {
        return Object.freeze([undefined as never, e as E])
    }
}

export async function fromAsyncFn<
    T,
    Fn extends () => Promise<T>,
    E extends Error = Error,
>(fn: Fn): AsyncResult<T, E> {
    try {
        return Object.freeze([await fn(), undefined as never])
    } catch (e) {
        return Object.freeze([undefined as never, e as E])
    }
}

export function Ok<T, E extends Error = Error>(
    value: PromiseLike<T>,
): AsyncResult<T, E>
export function Ok<T, E extends Error = Error>(value: T): Result<T, E>
export function Ok<T extends undefined, E extends Error = Error>(
    value?: T,
): Result<T, E>
export function Ok<T, E extends Error = Error>(
    value: T | PromiseLike<T>,
): Result<T, E> | AsyncResult<T, E> {
    if (
        value !== null &&
        typeof value === "object" &&
        "then" in value &&
        typeof value.then === "function"
    ) {
        return Promise.resolve(Ok(value as T))
    }

    return Object.freeze([value as T, undefined as never])
}

export function Err<T, E extends Error = Error>(err: E): Result<T, E> {
    return Object.freeze([undefined as never, err])
}

export function wrapErr<T, E extends Error = Error>(
    strings: TemplateStringsArray,
    ...exprs: any[]
): Result<T, E> {
    let stackErr = new Error()

    let errs: Error[] = []
    let msg = ""
    for (let i = 0; i < strings.length - 1; i++) {
        let value = exprs[i]
        if (value instanceof Error) {
            errs.push(value)
            msg = `${msg}${strings[i]}${value.message}`

            if (!value.stack && isCustomErrType(value)) {
                value.stack = stackErr.stack
            }
        } else {
            msg = `${msg}${strings[i]}${value}`
        }
    }

    msg = `${msg}${strings.at(-1)}`
    let err = new AggregateError(errs, msg)
    err.stack = errs.at(-1)?.stack

    return Object.freeze([undefined as never, err as any])
}

export async function toPromise<T, E extends Error = Error>(
    r: AsyncResult<T, E>,
): Promise<T> {
    let [value, err] = await r
    if (err) {
        return Promise.reject(err)
    }

    return Promise.resolve(value)
}

export async function all<T>(
    results: Iterable<AsyncResult<T>>,
): AsyncResult<T[]> {
    let resolved = await Promise.all(results)
    let values: T[] = []
    let errs: Error[] = []
    for (let [res, err] of resolved) {
        if (err) {
            errs.push(err)
            continue
        }
        values.push(res)
    }

    if (errs.length) {
        let err = new AggregateError(errs)
        err.stack = errs.at(-1)?.stack
        return Err(err)
    }

    return Ok(values)
}
