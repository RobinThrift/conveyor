import { jsonDeserialize, parseJSONDate } from "@/lib/json"
import { Ok, type Result } from "@/lib/result"

export type PlaintextAuthTokenValue = string & { readonly "": unique symbol }

export interface AuthToken {
    origin: string
    accessToken: PlaintextAuthTokenValue
    expiresAt: Date
    refreshToken: PlaintextAuthTokenValue
    refreshExpiresAt: Date
}

export class AuthTokenNotFoundError extends Error {
    constructor(suffix: string, options?: ErrorOptions) {
        super(`Auth token not found: ${suffix}`, options)
    }
}

export class PasswordChangeRequiredError extends Error {
    constructor(options?: ErrorOptions) {
        super("password change required", options)
    }
}

export function authTokenFromJSON(
    raw: Uint8Array<ArrayBufferLike>,
): Result<AuthToken> {
    let obj = jsonDeserialize<Record<string, unknown>>(raw)
    if (!obj.ok) {
        return obj
    }

    let expiresAt = parseJSONDate(obj.value.expiresAt as string)
    if (!expiresAt.ok) {
        return expiresAt
    }
    let refreshExpiresAt = parseJSONDate(obj.value.refreshExpiresAt as string)
    if (!refreshExpiresAt.ok) {
        return refreshExpiresAt
    }

    return Ok({
        origin: obj.value.origin as string,
        accessToken: obj.value.accessToken as PlaintextAuthTokenValue,
        expiresAt: expiresAt.value,
        refreshToken: obj.value.refreshToken as PlaintextAuthTokenValue,
        refreshExpiresAt: refreshExpiresAt.value,
    })
}
