import type { APIToken, APITokenList } from "@/domain/APIToken"
import type { Pagination } from "@/domain/Pagination"
import type { Context } from "@/lib/context"
import { createErrType } from "@/lib/errors"
import { jsonDeserialize, parseJSONDate } from "@/lib/json"
import { type AsyncResult, fromPromise, Ok, wrapErr } from "@/lib/result"
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

    public static ErrListAPITokens = createErrType(
        "APITokensV1APIClient",
        "error listing API tokens",
    )
    public async listAPITokens(
        ctx: Context,
        { pagination }: { pagination: Pagination<string> },
    ): AsyncResult<APITokenList> {
        let query = new URLSearchParams()
        query.set("page[size]", pagination.pageSize.toString())
        if (pagination.after) {
            query.set("page[after]", pagination.after)
        }

        let [req, createReqErr] = await this._createBaseRequest(
            ctx,
            "GET",
            `/api/auth/v1/apitokens?${query.toString()}`,
        )
        if (createReqErr) {
            return wrapErr`${new APITokensV1APIClient.ErrListAPITokens()}: ${createReqErr}`
        }

        let [res, err] = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (err) {
            return wrapErr`${new APITokensV1APIClient.ErrListAPITokens()} (${this._baseURL}): ${err}`
        }

        if (res.status === 401) {
            return wrapErr`${new APITokensV1APIClient.ErrListAPITokens()} (${this._baseURL}): ${new UnauthorizedError()}`
        }

        if (res.status !== 200) {
            let err = await APIError.fromHTTPResponse(res)
            return wrapErr`${new APITokensV1APIClient.ErrListAPITokens()} (${this._baseURL}): ${err}`
        }

        let [tokens, deserializationErr] = jsonDeserialize<APITokenList, any>(
            await res.text(),
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
                    let [createdAt, createdAtParseErr] = parseJSONDate(item.createdAt)
                    if (createdAtParseErr) {
                        return wrapErr`error parsing createdAt date: ${createdAtParseErr}`
                    }

                    let [expiresAt, expiresAtParseErr] = parseJSONDate(item.expiresAt)
                    if (expiresAtParseErr) {
                        return wrapErr`error parsing expiresAt date: ${expiresAtParseErr}`
                    }

                    items.push({
                        name: item.name,
                        expiresAt: expiresAt,
                        createdAt: createdAt,
                    })
                }

                return Ok({
                    items,
                    next: raw.next,
                })
            },
        )

        if (deserializationErr) {
            return wrapErr`${new APITokensV1APIClient.ErrListAPITokens()} (${this._baseURL}): error deserilising data: ${deserializationErr}`
        }

        return Ok(tokens)
    }

    public static ErrCreateAPIToken = createErrType(
        "APITokensV1APIClient",
        "error creating API token",
    )
    public async createAPIToken(
        ctx: Context,
        apitoken: CreateAPITokenRequest,
    ): AsyncResult<{ token: string }> {
        let [req, createReqErr] = await this._createBaseRequest(
            ctx,
            "POST",
            "/api/auth/v1/apitokens",
            JSON.stringify(apitoken),
        )
        if (createReqErr) {
            return wrapErr`${new APITokensV1APIClient.ErrCreateAPIToken()}: ${createReqErr}`
        }

        let [res, err] = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (err) {
            return wrapErr`${new APITokensV1APIClient.ErrCreateAPIToken()} (${this._baseURL}): ${err}`
        }

        if (res.status === 401) {
            return wrapErr`${new APITokensV1APIClient.ErrCreateAPIToken()} (${this._baseURL}): ${new UnauthorizedError()}`
        }

        if (res.status !== 201) {
            let err = await APIError.fromHTTPResponse(res)
            return wrapErr`${new APITokensV1APIClient.ErrCreateAPIToken()} (${this._baseURL}): ${err}`
        }

        let [token, deserializationErr] = jsonDeserialize<{ token: string }>(await res.text())
        if (deserializationErr) {
            return wrapErr`${new APITokensV1APIClient.ErrCreateAPIToken()} (${this._baseURL}): error deserilising data: ${deserializationErr}`
        }

        return Ok(token)
    }

    public static ErrDeleteAPIToken = createErrType(
        "APITokensV1APIClient",
        "error deleting API token",
    )
    public async deleteAPIToken(ctx: Context, name: string): AsyncResult<void> {
        let [req, createReqErr] = await this._createBaseRequest(
            ctx,
            "DELETE",
            `/api/auth/v1/apitokens/${name}`,
        )
        if (createReqErr) {
            return wrapErr`${new APITokensV1APIClient.ErrDeleteAPIToken()}: ${createReqErr}`
        }

        let [res, err] = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (err) {
            return wrapErr`${new APITokensV1APIClient.ErrDeleteAPIToken()} (${this._baseURL}): ${err}`
        }

        if (res.status === 401) {
            return wrapErr`${new APITokensV1APIClient.ErrDeleteAPIToken()} (${this._baseURL}): ${new UnauthorizedError()}`
        }

        if (res.status !== 204) {
            let err = await APIError.fromHTTPResponse(res)
            return wrapErr`${new APITokensV1APIClient.ErrDeleteAPIToken()} (${this._baseURL}): ${err}`
        }

        return Ok(undefined)
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
