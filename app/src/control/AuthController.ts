import type { Context } from "@/lib/context"
import { Err, Ok, type AsyncResult } from "@/lib/result"
import {
    AuthTokenNotFoundError,
    type AuthToken,
    type PlaintextAuthTokenValue,
    type PlaintextPassword,
} from "@/auth"
import { isAfter, currentDateTime, addMinutes } from "@/lib/date"

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

    public async getInitialToken(
        ctx: Context,
        creds: { username: string; password: PlaintextPassword },
    ): AsyncResult<void> {
        let token = await this._authPIClient.getTokenUsingCredentials(
            ctx,
            creds,
        )
        if (!token.ok) {
            return token
        }

        let saved = await this._storage.saveAuthToken(ctx, token.value)
        if (!saved.ok) {
            return saved
        }

        this._current = token.value
        return Ok(undefined)
    }

    public async getToken(ctx: Context): AsyncResult<string> {
        let current = await this._loadCurrentToken(ctx)
        if (!current.ok) {
            return current
        }

        let now = currentDateTime()
        if (
            this._current?.expiresAt &&
            isAfter(this._current.expiresAt, addMinutes(now, 1))
        ) {
            return Ok(this._current.accessToken)
        }

        if (
            this._current?.refreshExpiresAt &&
            isAfter(this._current.refreshExpiresAt, addMinutes(now, 1))
        ) {
            return this._refreshToken(ctx)
        }

        return Err(new Error("no valid access token or refresh token"))
    }

    private async _refreshToken(ctx: Context): AsyncResult<string> {
        let refreshToken = this._current?.refreshToken
        if (!refreshToken) {
            return Err(new Error("no valid access token or refresh token"))
        }

        let token = await this._authPIClient.getTokenUsingRefreshToken(ctx, {
            refreshToken,
        })
        if (!token.ok) {
            return token
        }

        let saved = await this._storage.saveAuthToken(ctx, token.value)
        if (!saved.ok) {
            return saved
        }

        this._current = token.value
        return Ok(token.value.accessToken)
    }

    private async _loadCurrentToken(
        ctx: Context,
    ): AsyncResult<AuthToken | undefined> {
        if (this._current) {
            return Ok(this._current)
        }

        let loaded = await this._storage.getAuthToken(ctx, this._origin)
        if (!loaded.ok) {
            if (loaded.err instanceof AuthTokenNotFoundError) {
                return Ok(undefined)
            }
            return loaded
        }

        this._current = loaded.value

        return loaded
    }
}

interface AuthStorage {
    getAuthToken(ctx: Context, origin: string): AsyncResult<AuthToken>
    saveAuthToken(ctx: Context, authToken: AuthToken): AsyncResult<void>
}

interface AuthAPIClient {
    getTokenUsingCredentials(
        ctx: Context,
        {
            username,
            password,
        }: { username: string; password: PlaintextPassword },
    ): AsyncResult<AuthToken>
    getTokenUsingRefreshToken(
        ctx: Context,
        { refreshToken }: { refreshToken: PlaintextAuthTokenValue },
    ): AsyncResult<AuthToken>
}
