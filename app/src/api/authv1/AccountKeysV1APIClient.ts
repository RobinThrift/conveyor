import type { AccountKey } from "@/domain/AccountKey"
import { encodeToBase64 } from "@/lib/base64"
import type { Context } from "@/lib/context"
import { createErrType } from "@/lib/errors"
import { type AsyncResult, Ok, fromPromise, wrapErr } from "@/lib/result"

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

    public static ErrApplyChangelogEntries = createErrType(
        "AccountKeysV1APIClient",
        "error uploading account key",
    )
    public async uploadAccountKey(ctx: Context, accountKey: AccountKey): AsyncResult<void> {
        let [req, createReqErr] = await this._createBaseRequest(
            ctx,
            "POST",
            "/api/auth/v1/keys",
            JSON.stringify({
                name: accountKey.name,
                type: accountKey.type,
                data: encodeToBase64(accountKey.data),
            }),
        )
        if (createReqErr) {
            return wrapErr`${new AccountKeysV1APIClient.ErrApplyChangelogEntries()}: ${createReqErr}`
        }

        let [res, uploadErr] = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (uploadErr) {
            return wrapErr`${new AccountKeysV1APIClient.ErrApplyChangelogEntries()}: error uploading account key: ${uploadErr}`
        }

        if (res.status === 401) {
            return wrapErr`error uploading account key ${new UnauthorizedError()}`
        }

        if (res.status !== 201) {
            let err = await APIError.fromHTTPResponse(res)
            return wrapErr`${new AccountKeysV1APIClient.ErrApplyChangelogEntries()}: error uploading account key: ${err}`
        }

        return Ok()
    }

    private async _createBaseRequest(
        ctx: Context,
        method: string,
        path: string,
        body?: BodyInit,
    ): AsyncResult<Request> {
        let [token, tokenErr] = await this._tokenStorage.getToken(ctx)
        if (tokenErr) {
            return wrapErr`error creating request: error getting token: ${tokenErr}`
        }

        return Ok(
            new Request(new URL(path, this._baseURL), {
                method,
                redirect: "follow",
                body,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }),
        )
    }
}

interface TokenStorage {
    getToken(ctx: Context): AsyncResult<string>
}

export interface CreateAPITokenRequest {
    name: string
    expiresAt: Date
}
