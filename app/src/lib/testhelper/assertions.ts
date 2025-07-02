import { assert } from "vitest"

import type { AsyncResult, Result } from "@/lib/result"

export function assertOkResult<T, E extends Error = Error>(r: AsyncResult<T, E>): Promise<T>
export function assertOkResult<T, E extends Error = Error>(r: Result<T, E>): T
export function assertOkResult<T, E extends Error = Error>(r: Result<T, E> | AsyncResult<T, E>) {
    if (typeof r === "object" && "then" in r && typeof r.then === "function") {
        return r.then(([value, err]) => {
            if (err) {
                assert.fail(`${err.message}: ${err.stack}`)
            }
            return value
        })
    }

    let [value, err] = r as Result<T, E>
    if (err) {
        assert.fail(`${err.message}: ${err.stack}`)
    }

    return value
}

export function assertErrResult<E extends Error = Error>(r: AsyncResult<unknown, E>): Promise<E>
export function assertErrResult<E extends Error = Error>(r: Result<any, E>): E
export function assertErrResult<E extends Error = Error>(
    r: Result<unknown, E> | AsyncResult<unknown, E>,
) {
    if (typeof r === "object" && "then" in r && typeof r.then === "function") {
        return r.then(([value, err]) => {
            if (!err) {
                assert.fail(`expected error, but got value: ${JSON.stringify(value)}`)
            }
            return err
        })
    }

    let [value, err] = r as Result<unknown, E>
    if (!err) {
        assert.fail(`expected error, but got value: ${JSON.stringify(value)}`)
    }

    return err
}
