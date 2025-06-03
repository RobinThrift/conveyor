import {
    type AuthToken,
    PasswordChangeRequiredError,
    type PlaintextAuthTokenValue,
} from "@/auth"
import type { PlaintextPassword } from "@/auth/credentials"
import type { Context } from "@/lib/context"
import { createErrType } from "@/lib/errors"
import { jsonDeserialize, parseJSONDate } from "@/lib/json"
import {
    type AsyncResult,
    Ok,
    fromPromise,
    fromThrowing,
    wrapErr,
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

    public static ErrGetTokenUsingCredentials = createErrType(
        "AuthV1APIClient",
        "error getting token using credentials",
    )
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

        let [res, err] = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (err) {
            return wrapErr`${new AuthV1APIClient.ErrGetTokenUsingCredentials()}: ${err}`
        }

        if (res.status === 401) {
            return wrapErr`${new AuthV1APIClient.ErrGetTokenUsingCredentials()}: ${new UnauthorizedError()}: "invalid credentials"`
        }

        if (res.status === 404) {
            return wrapErr`${new AuthV1APIClient.ErrGetTokenUsingCredentials()}: invalid login url`
        }

        if (res.status === 204) {
            return wrapErr`${new AuthV1APIClient.ErrGetTokenUsingCredentials()}: ${new PasswordChangeRequiredError()}`
        }

        if (res.status !== 201) {
            let err = await APIError.fromHTTPResponse(res)
            return wrapErr`${new AuthV1APIClient.ErrGetTokenUsingCredentials()}: ${err}`
        }

        let [token, deserializationErr] = this._authTokenFromJSON(
            await res.text(),
        )
        if (deserializationErr) {
            return wrapErr`${new AuthV1APIClient.ErrGetTokenUsingCredentials()}: ${deserializationErr}`
        }
        return Ok(token)
    }

    public static ErrGetTokenUsingRefreshToken = createErrType(
        "AuthV1APIClient",
        "error getting token using refresh token",
    )
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

        let [res, err] = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (err) {
            return wrapErr`${new AuthV1APIClient.ErrGetTokenUsingRefreshToken()}: ${err}`
        }

        if (res.status === 401) {
            return wrapErr`${new AuthV1APIClient.ErrGetTokenUsingCredentials()}: ${new UnauthorizedError()}: invalid refresh token`
        }

        if (res.status !== 201) {
            let err = await APIError.fromHTTPResponse(res)
            return wrapErr`${new AuthV1APIClient.ErrGetTokenUsingCredentials()}: ${err}`
        }

        let [token, deserializationErr] = this._authTokenFromJSON(
            await res.text(),
        )
        if (deserializationErr) {
            return wrapErr`${new AuthV1APIClient.ErrGetTokenUsingCredentials()}: ${deserializationErr}`
        }
        return Ok(token)
    }

    public static ErrChangePassword = createErrType(
        "AuthV1APIClient",
        "error changing password",
    )
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

        let [res, err] = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (err) {
            return wrapErr`${new AuthV1APIClient.ErrChangePassword()}: ${err}`
        }

        if (res.status === 401) {
            return wrapErr`${new AuthV1APIClient.ErrChangePassword()}: ${new UnauthorizedError()}`
        }

        if (res.status !== 204) {
            let err = await APIError.fromHTTPResponse(res)
            return wrapErr`${new AuthV1APIClient.ErrChangePassword()}: ${err}`
        }

        return Ok()
    }

    private _authTokenFromJSON(raw: string) {
        return jsonDeserialize<AuthToken, Record<string, any>>(raw, (obj) => {
            let [expiresAt, expiresAtParseErr] = parseJSONDate(
                obj.expiresAt as string,
            )
            if (expiresAtParseErr) {
                return wrapErr`error parsing expiresAt date: ${expiresAtParseErr}`
            }

            let [refreshExpiresAt, refreshExpiresAtParseErr] = parseJSONDate(
                obj.refreshExpiresAt as string,
            )
            if (refreshExpiresAtParseErr) {
                return wrapErr`error parsing refreshExpiresAt date: ${refreshExpiresAtParseErr}`
            }

            let [serverURL, serverURLParseErr] = fromThrowing(
                () => new URL(this._baseURL),
            )
            if (serverURLParseErr) {
                return wrapErr`error parsing serverURL: ${serverURLParseErr}`
            }

            return Ok({
                origin: serverURL.host,
                accessToken: obj.accessToken,
                expiresAt: expiresAt,
                refreshToken: obj.refreshToken,
                refreshExpiresAt: refreshExpiresAt,
            })
        })
    }
}

export interface CreateAPITokenRequest {
    name: string
    expiresAt: Date
}
