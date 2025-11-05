import type { Temporal } from "temporal-polyfill"

import { CustomErrCode } from "@/lib/errors"
import { jsonDeserialize, parseJSONDate } from "@/lib/json"
import { Ok, type Result, wrapErr } from "@/lib/result"

export type PlaintextAuthTokenValue = string & { readonly "": unique symbol }

export interface AuthToken {
    origin: string
    accessToken: PlaintextAuthTokenValue
    expiresAt: Temporal.ZonedDateTime
    refreshToken: PlaintextAuthTokenValue
    refreshExpiresAt: Temporal.ZonedDateTime
}

export class AuthTokenNotFoundError extends Error {
    static [CustomErrCode] = "AuthTokenNotFoundError"
    constructor(suffix: string, options?: ErrorOptions) {
        super(`Auth token not found: ${suffix}`, options)
    }
}

export class PasswordChangeRequiredError extends Error {
    static [CustomErrCode] = "PasswordChangeRequired"
    constructor(options?: ErrorOptions) {
        super("[PasswordChangeRequired]: password change required", options)
    }
}

const ErrAuthTokenFromJSON = new Error("error deserialising auth token from json")
export function authTokenFromJSON(raw: Uint8Array<ArrayBufferLike>): Result<AuthToken> {
    let [obj, deserializationErr] = jsonDeserialize<Record<string, unknown>>(raw)
    if (deserializationErr) {
        return wrapErr`${ErrAuthTokenFromJSON}: ${deserializationErr}`
    }

    let [expiresAt, expiresAtParseErr] = parseJSONDate(obj.expiresAt as string)
    if (expiresAtParseErr) {
        return wrapErr`${ErrAuthTokenFromJSON}: error parsing expiresAt date: ${expiresAtParseErr}`
    }

    let [refreshExpiresAt, refreshExpiresAtParseErr] = parseJSONDate(obj.refreshExpiresAt as string)
    if (refreshExpiresAtParseErr) {
        return wrapErr`${ErrAuthTokenFromJSON}: error parsing refreshExpiresAt date: ${refreshExpiresAtParseErr}`
    }

    return Ok({
        origin: obj.origin as string,
        accessToken: obj.accessToken as PlaintextAuthTokenValue,
        expiresAt: expiresAt,
        refreshToken: obj.refreshToken as PlaintextAuthTokenValue,
        refreshExpiresAt: refreshExpiresAt,
    })
}
