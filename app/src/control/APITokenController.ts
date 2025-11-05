import type { Temporal } from "temporal-polyfill"

import type { APITokenList } from "@/domain/APIToken"
import type { Pagination } from "@/domain/Pagination"
import type { Context } from "@/lib/context"
import type { AsyncResult } from "@/lib/result"

export class APITokenController {
    private _apiTokenAPIClient: APITokenAPIClient

    constructor({
        apiTokenAPIClient,
    }: {
        apiTokenAPIClient: APITokenAPIClient
    }) {
        this._apiTokenAPIClient = apiTokenAPIClient
    }

    public setBaseURL(baseURL: string): void {
        this._apiTokenAPIClient.setBaseURL(baseURL)
    }

    public async listAPITokens(
        ctx: Context,
        {
            pagination,
        }: {
            pagination: Pagination<string>
        },
    ): AsyncResult<APITokenList> {
        return this._apiTokenAPIClient.listAPITokens(ctx, { pagination })
    }

    public async createAPIToken(
        ctx: Context,
        apitoken: CreateAPITokenRequest,
    ): AsyncResult<{ token: string }> {
        return this._apiTokenAPIClient.createAPIToken(ctx, apitoken)
    }

    public async deleteAPIToken(ctx: Context, name: string): AsyncResult<void> {
        return this._apiTokenAPIClient.deleteAPIToken(ctx, name)
    }
}

export interface CreateAPITokenRequest {
    name: string
    expiresAt: Temporal.ZonedDateTime
}

interface APITokenAPIClient {
    setBaseURL(baseURL: string): void
    listAPITokens(
        ctx: Context,
        {
            pagination,
        }: {
            pagination: Pagination<string>
        },
    ): AsyncResult<APITokenList>

    createAPIToken(ctx: Context, apitoken: CreateAPITokenRequest): AsyncResult<{ token: string }>

    deleteAPIToken(ctx: Context, name: string): AsyncResult<void>
}
