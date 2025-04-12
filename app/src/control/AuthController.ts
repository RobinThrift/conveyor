import {
    type AuthToken,
    AuthTokenNotFoundError,
    type PlaintextAuthTokenValue,
    type PlaintextPassword,
} from "@/auth"
import type { KVStore } from "@/lib/KVStore"
import type { Context } from "@/lib/context"
import { currentDateTime, isAfter } from "@/lib/i18n"
import { type AsyncResult, Err, Ok } from "@/lib/result"

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

    public setOrigin(origin: string) {
        this._origin = origin
    }

    public async reset(ctx: Context): AsyncResult<void> {
        this._current = undefined
        return this._storage.clear(ctx)
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

        let saved = await this._storage.setItem(
            ctx,
            token.value.origin,
            token.value,
        )
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
            isAfter(this._current.expiresAt, now.add({ minutes: 1 }))
        ) {
            return Ok(this._current.accessToken)
        }

        if (
            this._current?.refreshExpiresAt &&
            isAfter(this._current.refreshExpiresAt, now.add({ minutes: 1 }))
        ) {
            return this._refreshToken(ctx)
        }

        return Err(new Error("no valid access token or refresh token"))
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

        let token = await this._authPIClient.getTokenUsingRefreshToken(ctx, {
            refreshToken,
        })
        if (!token.ok) {
            return token
        }

        let saved = await this._storage.setItem(
            ctx,
            token.value.origin,
            token.value,
        )
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

        let loaded = await this._storage.getItem(ctx, this._origin)
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

type AuthStorage = KVStore<{
    [key: string]: AuthToken
}>

interface AuthAPIClient {
    setBaseURL(baseURL: string): void
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
