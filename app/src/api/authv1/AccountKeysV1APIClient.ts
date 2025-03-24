import type { AccountKey } from "@/domain/AccountKey"
import { encodeToBase64 } from "@/lib/base64"
import type { Context } from "@/lib/context"
import { type AsyncResult, Err, Ok, fmtErr, fromPromise } from "@/lib/result"

import { APIError, UnauthorizedError } from "../apiv1/APIError"

export class AccountKeysV1APIClient {
    private _baseURL: string
    private _tokenStorage: TokenStorage

    constructor({
        baseURL,
        tokenStorage,
    }: {
        baseURL: string
        tokenStorage: TokenStorage
    }) {
        this._baseURL = baseURL
        this._tokenStorage = tokenStorage
    }

    setBaseURL(baseURL: string) {
        this._baseURL = baseURL
    }

    public async uploadAccountKey(
        ctx: Context,
        accountKey: AccountKey,
    ): AsyncResult<void> {
        let req = await this._createBaseRequest(
            ctx,
            "POST",
            "/api/auth/v1/keys",
            JSON.stringify({
                name: accountKey.name,
                type: accountKey.type,
                data: encodeToBase64(accountKey.data),
            }),
        )
        if (!req.ok) {
            return req
        }

        let res = await fromPromise(fetch(req.value, { signal: ctx.signal }))
        if (!res.ok) {
            return fmtErr("error uploading account key: %w", res)
        }

        if (res.value.status === 401) {
            return Err(new UnauthorizedError("error uploading account key"))
        }

        if (res.value.status !== 201) {
            let err = await APIError.fromHTTPResponse(res.value)
            return Err(err.withPrefix("error uploading account key"))
        }

        return Ok(undefined)
    }

    private async _createBaseRequest(
        ctx: Context,
        method: string,
        path: string,
        body?: BodyInit,
    ): AsyncResult<Request> {
        let token = await this._tokenStorage.getToken(ctx)
        if (!token.ok) {
            return token
        }

        let req = new Request(new URL(path, this._baseURL), {
            method,
            redirect: "follow",
            body,
            headers: {
                Authorization: `Bearer ${token.value}`,
            },
        })

        return Ok(req)
    }
}

interface TokenStorage {
    getToken(ctx: Context): AsyncResult<string>
}

export interface CreateAPITokenRequest {
    name: string
    expiresAt: Date
}
