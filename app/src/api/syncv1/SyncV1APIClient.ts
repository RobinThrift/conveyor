import type { EncryptedChangelogEntry } from "@/domain/Changelog"
import type { Context } from "@/lib/context"
import {
    type AsyncResult,
    Err,
    Ok,
    type Result,
    fmtErr,
    fromPromise,
    fromThrowing,
} from "@/lib/result"
import { parseJSON } from "date-fns"

import { APIError, UnauthorizedError } from "../apiv1/APIError"

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

    setBaseURL(baseURL: string) {
        this._baseURL = baseURL
    }

    public async registerClient(
        ctx: Context,
        syncClient: { clientID: string },
    ): AsyncResult<void> {
        let req = await this._createBaseRequest(
            ctx,
            "POST",
            "/api/sync/v1/clients",
            JSON.stringify({ clientID: syncClient.clientID }),
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
        let req = await this._createBaseRequest(ctx, "GET", "/api/sync/v1/full")
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

        if (res.value.status === 303) {
            let locHeader = res.value.headers.get("location")
            if (!locHeader) {
                return Err(
                    new Error(
                        `error fetching full DB from sync server (${this._baseURL}): request returned status 303 but no Location header`,
                    ),
                )
            }
            return this._downloadDBFromLocation(ctx, locHeader)
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

    private async _downloadDBFromLocation(
        ctx: Context,
        location: string,
    ): AsyncResult<ArrayBufferLike> {
        let req = await this._createBaseRequest(ctx, "GET", location)
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
            ctx,
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
            ctx,
            "GET",
            `/api/sync/v1/changes?since=${JSON.parse(JSON.stringify(since ?? new Date(2000, 0, 1)))}`,
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

        return parseEncryptedChangelogEntryJSON(data.value)
    }

    public async uploadChangelogEntries(
        ctx: Context,
        entries: EncryptedChangelogEntry[],
    ): AsyncResult<void> {
        let req = await this._createBaseRequest(
            ctx,
            "POST",
            "/api/sync/v1/changes",
            JSON.stringify({ items: entries }),
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

        return Ok(undefined)
    }

    public async uploadAttachment(
        ctx: Context,
        attachment: {
            filepath: string
            data: Uint8Array<ArrayBufferLike>
        },
    ): AsyncResult<void> {
        let req = await this._createBaseRequest(
            ctx,
            "POST",
            "/api/sync/v1/attachments",
            await compressData(attachment.data),
        )
        if (!req.ok) {
            return req
        }

        req.value.headers.set("X-Filepath", attachment.filepath)
        req.value.headers.set("Content-Type", "application/octet-stream")
        req.value.headers.set("Content-Encoding", "gzip")

        let res = await fromPromise(fetch(req.value, { signal: ctx.signal }))
        if (!res.ok) {
            return fmtErr(
                `error uploading attachment (${this._baseURL}): %w`,
                res,
            )
        }

        if (res.value.status !== 201) {
            return Err(
                new Error(
                    `error uploading attachment (${this._baseURL}): ${res.value.status} ${res.value.statusText}`,
                ),
            )
        }

        return Ok(undefined)
    }

    public async getAttachmentDataByFilepath(
        ctx: Context,
        filepath: string,
    ): AsyncResult<ArrayBufferLike> {
        let req = await this._createBaseRequest(ctx, "GET", `/blobs${filepath}`)
        if (!req.ok) {
            return req
        }

        let res = await fromPromise(fetch(req.value, { signal: ctx.signal }))
        if (!res.ok) {
            return fmtErr(
                `error getting attachment (${req.value.url.toString()}): %w`,
                res,
            )
        }

        if (res.value.status !== 200) {
            return Err(
                new Error(
                    `error uploading attachment (${req.value.url.toString()}): ${res.value.status} ${res.value.statusText}`,
                ),
            )
        }

        return fromPromise(res.value.arrayBuffer())
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

function parseEncryptedChangelogEntryJSON(
    raw: string,
): Result<EncryptedChangelogEntry[]> {
    return fromThrowing(() => {
        let objs = JSON.parse(raw)
        let entries: EncryptedChangelogEntry[] = []

        for (let obj of objs.items) {
            entries.push({
                syncClientID: obj.syncClientID,
                data: obj.data,
                timestamp: parseJSON(obj.timestamp),
            })
        }

        return entries
    })
}

async function compressData(data: Uint8Array<ArrayBufferLike>) {
    let stream = new ReadableStream({
        start(controller) {
            controller.enqueue(data)
            controller.close()
        },
    })

    let { readable, writable } = new TransformStream()
    stream.pipeThrough(new CompressionStream("gzip")).pipeTo(writable)

    return streamToBlob(readable.getReader())
}

async function streamToBlob(
    reader: ReadableStreamDefaultReader,
): Promise<Blob> {
    let chunks: BlobPart[] = []

    return reader.read().then(async function read({
        done,
        value,
    }: ReadableStreamReadResult<Uint8Array>): Promise<Blob> {
        if (done) {
            return new Blob(chunks)
        }

        chunks.push(value)

        return reader.read().then(read)
    })
}
