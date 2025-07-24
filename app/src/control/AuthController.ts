import {
    type AuthToken,
    AuthTokenNotFoundError,
    type PlaintextAuthTokenValue,
    type PlaintextPassword,
} from "@/auth"
import type { KVStore } from "@/lib/KVStore"
import type { Context } from "@/lib/context"
import { createErrType, isErr } from "@/lib/errors"
import { currentDateTime, isAfter } from "@/lib/i18n"
import { type AsyncResult, Err, Ok, wrapErr } from "@/lib/result"

export class AuthController {
    private _origin: string
    private _storage: AuthStorage
    private _authPIClient: AuthAPIClient

    private _current: AuthToken | undefined = undefined

    constructor({
        origin,
        storage,
        authPIClient,
    }: {
        origin: string
        storage: AuthStorage
        authPIClient: AuthAPIClient
    }) {
        this._origin = origin
        this._storage = storage
        this._authPIClient = authPIClient
    }

    public async setOrigin(_: Context, origin: string): AsyncResult<void> {
        this._origin = origin
        return Ok()
    }

    public async reset(ctx: Context): AsyncResult<void> {
        this._current = undefined
        return this._storage.clear(ctx)
    }

    public static ErrGetInitialToken = createErrType(
        "AuthController",
        "error getting initial token",
    )
    public async getInitialToken(
        ctx: Context,
        creds: { username: string; password: PlaintextPassword },
    ): AsyncResult<void> {
        let [token, getTokenErr] = await this._authPIClient.getTokenUsingCredentials(ctx, creds)
        if (getTokenErr) {
            return wrapErr`${new AuthController.ErrGetInitialToken()}: ${getTokenErr}`
        }

        let [_, storeErr] = await this._storage.setItem(ctx, token.origin, token)
        if (storeErr) {
            return wrapErr`${new AuthController.ErrGetInitialToken()}: error storing item for origin "${token.origin}": ${storeErr}`
        }

        this._current = token
        return Ok(undefined)
    }

    public static ErrGetToken = createErrType("AuthController", "error getting token")
    public async getToken(ctx: Context): AsyncResult<string> {
        let [_, loadErr] = await this._loadCurrentToken(ctx)
        if (loadErr) {
            return wrapErr`${new AuthController.ErrGetToken()}: ${loadErr}`
        }

        let now = currentDateTime()
        if (this._current?.expiresAt && isAfter(this._current.expiresAt, now.add({ minutes: 1 }))) {
            return Ok(this._current.accessToken)
        }

        if (
            this._current?.refreshExpiresAt &&
            isAfter(this._current.refreshExpiresAt, now.add({ minutes: 1 }))
        ) {
            return this._refreshToken(ctx)
        }

        return wrapErr`${new AuthController.ErrGetToken()}: no valid access token or refresh token`
    }

    public async changePassword(
        ctx: Context,
        creds: {
            username: string
            currentPassword: PlaintextPassword
            newPassword: PlaintextPassword
            newPasswordRepeat: PlaintextPassword
        },
    ): AsyncResult<void> {
        return this._authPIClient.changePassword(ctx, creds)
    }

    private async _refreshToken(ctx: Context): AsyncResult<string> {
        let refreshToken = this._current?.refreshToken
        if (!refreshToken) {
            return Err(new Error("no valid access token or refresh token"))
        }

        let [token, getTokenErr] = await this._authPIClient.getTokenUsingRefreshToken(ctx, {
            refreshToken,
        })
        if (getTokenErr) {
            return Err(getTokenErr)
        }

        let [_, storeErr] = await this._storage.setItem(ctx, token.origin, token)
        if (storeErr) {
            return Err(storeErr)
        }

        this._current = token
        return Ok(token.accessToken)
    }

    private async _loadCurrentToken(ctx: Context): AsyncResult<AuthToken | undefined> {
        if (this._current) {
            return Ok(this._current)
        }

        let [item, loadErr] = await this._storage.getItem(ctx, this._origin)
        if (loadErr) {
            if (isErr(loadErr, AuthTokenNotFoundError)) {
                return Ok(undefined)
            }
            return Err(loadErr)
        }

        this._current = item

        return Ok(item)
    }
}

type AuthStorage = KVStore<{
    [key: string]: AuthToken
}>

interface AuthAPIClient {
    setBaseURL(baseURL: string): void
    getTokenUsingCredentials(
        ctx: Context,
        { username, password }: { username: string; password: PlaintextPassword },
    ): AsyncResult<AuthToken>
    getTokenUsingRefreshToken(
        ctx: Context,
        { refreshToken }: { refreshToken: PlaintextAuthTokenValue },
    ): AsyncResult<AuthToken>
    changePassword(
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
    ): AsyncResult<void>
}
