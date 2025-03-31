import type { Context } from "@/lib/context"
import { jsonDeserialize, parseJSONDate } from "@/lib/json"
import { type AsyncResult, Err, Ok, fmtErr, fromPromise } from "@/lib/result"

import type { APIToken, APITokenList } from "@/domain/APIToken"
import type { Pagination } from "@/domain/Pagination"
import { APIError, UnauthorizedError } from "../apiv1/APIError"

export class APITokensV1APIClient {
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

    public async listAPITokens(
        ctx: Context,
        {
            pagination,
        }: {
            pagination: Pagination<string>
        },
    ): AsyncResult<APITokenList> {
        let query = new URLSearchParams()
        query.set("page[size]", pagination.pageSize.toString())
        if (pagination.after) {
            query.set("page[after]", pagination.after)
        }

        let req = await this._createBaseRequest(
            ctx,
            "GET",
            `/api/auth/v1/apitokens?${query.toString()}`,
        )
        if (!req.ok) {
            return req
        }

        let res = await fromPromise(fetch(req.value, { signal: ctx.signal }))
        if (!res.ok) {
            return fmtErr(
                `error listing API Tokens (${this._baseURL}): %w`,
                res,
            )
        }

        if (res.value.status === 401) {
            return Err(
                new UnauthorizedError(
                    `error listing API Tokens (${this._baseURL})`,
                ),
            )
        }

        if (res.value.status !== 200) {
            let err = await APIError.fromHTTPResponse(res.value)
            return Err(
                err.withPrefix(`error listing API Tokens (${this._baseURL})`),
            )
        }

        return jsonDeserialize(
            await res.value.text(),
            (raw: {
                next?: string
                items: {
                    name: string
                    createdAt: string
                    expiresAt: string
                }[]
            }) => {
                let items: APIToken[] = []
                for (let item of raw.items) {
                    let createdAt = parseJSONDate(item.createdAt)
                    if (!createdAt.ok) {
                        return createdAt
                    }
                    let expiresAt = parseJSONDate(item.expiresAt)
                    if (!expiresAt.ok) {
                        return expiresAt
                    }

                    items.push({
                        name: item.name,
                        expiresAt: expiresAt.value,
                        createdAt: createdAt.value,
                    })
                }
                return Ok({
                    items,
                    next: raw.next,
                })
            },
        )
    }

    public async createAPIToken(
        ctx: Context,
        apitoken: CreateAPITokenRequest,
    ): AsyncResult<{ token: string }> {
        let req = await this._createBaseRequest(
            ctx,
            "POST",
            "/api/auth/v1/apitokens",
            JSON.stringify(apitoken),
        )
        if (!req.ok) {
            return req
        }

        let res = await fromPromise(fetch(req.value, { signal: ctx.signal }))
        if (!res.ok) {
            return fmtErr(
                `error creating API Token (${this._baseURL}): %w`,
                res,
            )
        }

        if (res.value.status === 401) {
            return Err(
                new UnauthorizedError(
                    `error creating API Token (${this._baseURL})`,
                ),
            )
        }

        if (res.value.status !== 201) {
            let err = await APIError.fromHTTPResponse(res.value)
            return Err(
                err.withPrefix(`error creating API Token (${this._baseURL})`),
            )
        }

        return jsonDeserialize(await res.value.text())
    }

    public async deleteAPIToken(ctx: Context, name: string): AsyncResult<void> {
        let req = await this._createBaseRequest(
            ctx,
            "DELETE",
            `/api/auth/v1/apitokens/${name}`,
        )
        if (!req.ok) {
            return req
        }

        if (!req.ok) {
            return req
        }

        let res = await fromPromise(fetch(req.value, { signal: ctx.signal }))
        if (!res.ok) {
            return fmtErr(
                `error deleting API Token (${this._baseURL}): %w`,
                res,
            )
        }

        if (res.value.status === 401) {
            return Err(
                new UnauthorizedError(
                    `error deleting API Token (${this._baseURL})`,
                ),
            )
        }

        if (res.value.status !== 204) {
            let err = await APIError.fromHTTPResponse(res.value)
            return Err(
                err.withPrefix(`error deleting API Tokens (${this._baseURL})`),
            )
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
