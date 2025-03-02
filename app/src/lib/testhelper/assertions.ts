import { assert } from "vitest"

import type { AsyncResult, Result } from "@/lib/result"

export function assertOkResult<T, E extends Error = Error>(
    r: AsyncResult<T, E>,
): Promise<T>
export function assertOkResult<T, E extends Error = Error>(r: Result<T, E>): T
export function assertOkResult<T, E extends Error = Error>(
    r: Result<T, E> | AsyncResult<T, E>,
) {
    if (typeof r === "object" && "then" in r && typeof r.then === "function") {
        return r.then((rr) => {
            if (!rr.ok) {
                assert.fail(`${rr.err.message}: ${rr.err.stack}`)
            }
            return rr.value
        })
    }

    let rr = r as Result<T, E>
    if (!rr.ok) {
        assert.fail(`${rr.err.message}: ${rr.err.stack}`)
    }

    return rr.value
}

export function assertErrResult<E extends Error = Error>(
    r: AsyncResult<unknown, E>,
): Promise<E>
export function assertErrResult<E extends Error = Error>(r: Result<any, E>): E
export function assertErrResult<E extends Error = Error>(
    r: Result<unknown, E> | AsyncResult<unknown, E>,
) {
    if (typeof r === "object" && "then" in r && typeof r.then === "function") {
        return r.then((rr) => {
            if (rr.ok) {
                assert.fail(
                    `expected error, but got value: ${JSON.stringify(rr.value)}`,
                )
            }
            return rr.err
        })
    }

    let rr = r as Result<unknown, E>
    if (rr.ok) {
        assert.fail(
            `expected error, but got value: ${JSON.stringify(rr.value)}`,
        )
    }

    return rr.err
}
