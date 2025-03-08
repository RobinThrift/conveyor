import type { AuthToken, PlaintextAuthTokenValue } from "@/auth"
import type { PlaintextPassword } from "@/auth/credentials"
import type { Context } from "@/lib/context"
import { type AsyncResult, Err, Ok, fmtErr, fromPromise } from "@/lib/result"
import { parseJSON, parseJSONDate } from "@/lib/json"

import { APIError, UnauthorizedError } from "../apiv1/APIError"

export class AuthV1APIClient {
    private _baseURL: string

    constructor({
        baseURL,
    }: {
        baseURL: string
    }) {
        this._baseURL = baseURL
    }

    public async getTokenUsingCredentials(
        ctx: Context,
        {
            username,
            password,
        }: { username: string; password: PlaintextPassword },
    ): AsyncResult<AuthToken> {
        let req = new Request(new URL("/api/auth/v1/token", this._baseURL), {
            method: "POST",
            body: JSON.stringify({
                grant_type: "password",
                username,
                password,
            }),
        })

        let res = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (!res.ok) {
            return fmtErr("error getting token using credentials: %w", res)
        }

        if (res.value.status === 401) {
            return Err(new UnauthorizedError("invalid credentials"))
        }

        if (res.value.status !== 200) {
            let err = await APIError.fromHTTPResponse(res.value)
            return Err(err.withPrefix("error getting token using credentials"))
        }

        let body = await res.value.text()

        return this._authTokenFromJSON(body)
    }

    public async getTokenUsingRefreshToken(
        ctx: Context,
        { refreshToken }: { refreshToken: PlaintextAuthTokenValue },
    ): AsyncResult<AuthToken> {
        let req = new Request(new URL("/api/auth/v1/token", this._baseURL), {
            method: "POST",
            body: JSON.stringify({
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }),
        })

        let res = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (!res.ok) {
            return fmtErr("error getting token using refresh token: %w", res)
        }

        if (res.value.status === 401) {
            return Err(new UnauthorizedError("invalid refresh token"))
        }

        if (res.value.status !== 200) {
            let err = await APIError.fromHTTPResponse(res.value)
            return Err(
                err.withPrefix("error getting token using refresh token"),
            )
        }

        let body = await res.value.text()

        return this._authTokenFromJSON(body)
    }

    private _authTokenFromJSON(raw: string) {
        return parseJSON<AuthToken, Record<string, any>>(raw, (obj) => {
            let expiresAt = parseJSONDate(obj.expiresAt)
            if (!expiresAt.ok) {
                return expiresAt
            }
            let refreshExpiresAt = parseJSONDate(obj.refreshExpiresAt)
            if (!refreshExpiresAt.ok) {
                return refreshExpiresAt
            }

            return Ok({
                origin: this._baseURL,
                accessToken: obj.accessToken,
                expiresAt: expiresAt.value,
                refreshToken: obj.refreshToken,
                refreshExpiresAt: refreshExpiresAt.value,
            })
        })
    }
}
