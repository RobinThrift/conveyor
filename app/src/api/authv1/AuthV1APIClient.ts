import {
    type AuthToken,
    PasswordChangeRequiredError,
    type PlaintextAuthTokenValue,
} from "@/auth"
import type { PlaintextPassword } from "@/auth/credentials"
import type { Context } from "@/lib/context"
import { parseJSON, parseJSONDate } from "@/lib/json"
import {
    type AsyncResult,
    Err,
    Ok,
    fmtErr,
    fromPromise,
    fromThrowing,
} from "@/lib/result"

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

    setBaseURL(baseURL: string) {
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

        if (res.value.status === 404) {
            return Err(new Error("invalid login url"))
        }

        if (res.value.status === 204) {
            return Err(new PasswordChangeRequiredError())
        }

        if (res.value.status !== 201) {
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

        if (res.value.status !== 201) {
            let err = await APIError.fromHTTPResponse(res.value)
            return Err(
                err.withPrefix("error getting token using refresh token"),
            )
        }

        let body = await res.value.text()

        return this._authTokenFromJSON(body)
    }

    public async changePassword(
        ctx: Context,
        {
            username,
            currentPassword,
            newPassword,
            newPasswordRepeat,
        }: {
            username: string
            currentPassword: PlaintextPassword
            newPassword: PlaintextPassword
            newPasswordRepeat: PlaintextPassword
        },
    ): AsyncResult<void> {
        let req = new Request(
            new URL("/api/auth/v1/change-password", this._baseURL),
            {
                method: "POST",
                body: JSON.stringify({
                    username,
                    currentPassword,
                    newPassword,
                    newPasswordRepeat,
                }),
            },
        )

        let res = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (!res.ok) {
            return fmtErr("error changing password: %w", res)
        }

        if (res.value.status === 401) {
            return Err(new UnauthorizedError("error changing password"))
        }

        if (res.value.status !== 204) {
            let err = await APIError.fromHTTPResponse(res.value)
            return Err(err.withPrefix("error changing password"))
        }

        return Ok(undefined)
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

            let serverURL = fromThrowing(() => new URL(this._baseURL))
            if (!serverURL.ok) {
                return serverURL
            }

            return Ok({
                origin: serverURL.value.host,
                accessToken: obj.accessToken,
                expiresAt: expiresAt.value,
                refreshToken: obj.refreshToken,
                refreshExpiresAt: refreshExpiresAt.value,
            })
        })
    }
}
