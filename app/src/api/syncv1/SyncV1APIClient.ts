import type { EncryptedChangelogEntry } from "@/domain/Changelog"
import { APIError, UnauthorizedError } from "../apiv1/APIError"
import type { Context } from "@/lib/context"
import {
    Err,
    fmtErr,
    fromPromise,
    fromThrowing,
    Ok,
    type AsyncResult,
} from "@/lib/result"

export class SyncV1APIClient {
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

    public async registerClient(
        ctx: Context,
        syncClient: { clientID: string },
    ): AsyncResult<void> {
        let req = await this._createBaseRequest(
            "GET",
            "/api/sync/v1/clients",
            JSON.stringify({ ClientID: syncClient.clientID }),
        )
        if (!req.ok) {
            return req
        }

        let res = await fromPromise(fetch(req.value, { signal: ctx.signal }))
        if (!res.ok) {
            return fmtErr(
                `error registering client (${this._baseURL}): %w`,
                res,
            )
        }

        if (res.value.status === 401) {
            return Err(
                new UnauthorizedError(
                    `error registering client (${this._baseURL})`,
                ),
            )
        }

        if (res.value.status !== 201) {
            let err = await APIError.fromHTTPResponse(res.value)
            return Err(
                err.withPrefix(`error registering client (${this._baseURL})`),
            )
        }

        return Ok(undefined)
    }

    public async getFullSync(ctx: Context): AsyncResult<ArrayBufferLike> {
        let req = await this._createBaseRequest("GET", "/api/sync/v1/full")
        if (!req.ok) {
            return req
        }

        let res = await fromPromise(fetch(req.value, { signal: ctx.signal }))
        if (!res.ok) {
            return fmtErr(
                `error fetching full DB from sync server (${this._baseURL}): %w`,
                res,
            )
        }

        if (res.value.status === 401) {
            return Err(
                new UnauthorizedError(
                    `error fetching full DB from sync server (${this._baseURL})`,
                ),
            )
        }

        if (res.value.status !== 200) {
            let err = await APIError.fromHTTPResponse(res.value)
            return Err(
                err.withPrefix(
                    `error fetching full DB from sync server (${this._baseURL})`,
                ),
            )
        }

        let data = await fromPromise(res.value.arrayBuffer())
        if (!data.ok) {
            return fmtErr(
                `error fetching full DB from sync server (${this._baseURL}): error reading data: %w`,
                data,
            )
        }

        return data
    }

    public async uploadFullSyncData(
        ctx: Context,
        data: ArrayBufferLike,
    ): AsyncResult<void> {
        let req = await this._createBaseRequest(
            "POST",
            "/api/sync/v1/full",
            new Uint8Array(data),
        )
        if (!req.ok) {
            return req
        }

        let res = await fromPromise(fetch(req.value, { signal: ctx.signal }))
        if (!res.ok) {
            return fmtErr(
                `error uploading full DB to sync server (${this._baseURL}): %w`,
                res,
            )
        }

        if (res.value.status === 401) {
            return Err(
                new UnauthorizedError(
                    `error uploading full DB to sync server (${this._baseURL})`,
                ),
            )
        }

        if (res.value.status !== 201) {
            let err = await APIError.fromHTTPResponse(res.value)
            return Err(
                err.withPrefix(
                    `error uploading full DB to sync server (${this._baseURL})`,
                ),
            )
        }

        return Ok(undefined)
    }

    public async listChangelogEntries(
        ctx: Context,
        since?: Date,
    ): AsyncResult<EncryptedChangelogEntry[]> {
        let req = await this._createBaseRequest(
            "GET",
            `/api/sync/v1/changes?since=${JSON.stringify(since ?? new Date(2000, 0, 1))}`,
        )
        if (!req.ok) {
            return req
        }

        let res = await fromPromise(fetch(req.value, { signal: ctx.signal }))
        if (!res.ok) {
            return fmtErr(
                `error fetching changelog entries (${this._baseURL}): %w`,
                res,
            )
        }

        if (res.value.status !== 200) {
            return Err(
                new Error(
                    `error fetching changelog entries (${this._baseURL}): ${res.value.status} ${res.value.statusText}`,
                ),
            )
        }

        let data = await fromPromise(res.value.text())
        if (!data.ok) {
            return fmtErr(
                `error fetching changelog entries (${this._baseURL}): error reading data: %w`,
                data,
            )
        }

        return fromThrowing(() => JSON.parse(data.value))
    }

    public async uploadChangelogEntries(
        ctx: Context,
        entries: EncryptedChangelogEntry[],
    ): AsyncResult<void> {
        let req = await this._createBaseRequest(
            "POST",
            "/api/sync/v1/changes",
            JSON.stringify(entries),
        )
        if (!req.ok) {
            return req
        }

        let res = await fromPromise(fetch(req.value, { signal: ctx.signal }))
        if (!res.ok) {
            return fmtErr(
                `error uploading changelog entries (${this._baseURL}): %w`,
                res,
            )
        }

        if (res.value.status !== 201) {
            return Err(
                new Error(
                    `error uploading changelog entries (${this._baseURL}): ${res.value.status} ${res.value.statusText}`,
                ),
            )
        }

        let data = await fromPromise(res.value.text())
        if (!data.ok) {
            return fmtErr(
                `error uploading changelog entries (${this._baseURL}): error reading data: %w`,
                data,
            )
        }

        return Ok(undefined)
    }

    private async _createBaseRequest(
        method: string,
        path: string,
        body?: BodyInit,
    ): AsyncResult<Request> {
        let token = await this._tokenStorage.getToken()
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
    getToken(): AsyncResult<string>
}
