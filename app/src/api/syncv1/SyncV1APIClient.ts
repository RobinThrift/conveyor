import type { EncryptedChangelogEntry } from "@/domain/Changelog"
import type { Context } from "@/lib/context"
import { createErrType } from "@/lib/errors"
import { parseJSONDate } from "@/lib/json"
import {
    type AsyncResult,
    Err,
    fromPromise,
    fromThrowing,
    Ok,
    type Result,
    wrapErr,
} from "@/lib/result"

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

    public static ErrRegisterClient = createErrType(
        "SyncV1APIClient",
        "error registering sync client",
    )
    public async registerClient(ctx: Context, syncClient: { clientID: string }): AsyncResult<void> {
        let [req, createReqErr] = await this._createBaseRequest(
            ctx,
            "POST",
            "/api/sync/v1/clients",
            JSON.stringify({ clientID: syncClient.clientID }),
        )
        if (createReqErr) {
            return wrapErr`${new SyncV1APIClient.ErrRegisterClient()}: ${syncClient.clientID}: ${createReqErr}`
        }

        let [res, err] = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (err) {
            return wrapErr`${new SyncV1APIClient.ErrRegisterClient()} (${this._baseURL}): ${err}`
        }

        if (res.status === 401) {
            return wrapErr`${new SyncV1APIClient.ErrRegisterClient()} (${this._baseURL}): ${new UnauthorizedError()}`
        }

        if (res.status !== 201) {
            let err = await APIError.fromHTTPResponse(res)
            return wrapErr`${new SyncV1APIClient.ErrRegisterClient()} (${this._baseURL}): ${err}`
        }

        return Ok(undefined)
    }

    public static ErrGetFullSync = createErrType(
        "SyncV1APIClient",
        "error fetching full DB from sync server",
    )
    public async getFullSync(ctx: Context): AsyncResult<ArrayBufferLike> {
        let [req, createReqErr] = await this._createBaseRequest(ctx, "GET", "/api/sync/v1/full")
        if (createReqErr) {
            return wrapErr`${new SyncV1APIClient.ErrGetFullSync()}: ${createReqErr}`
        }

        let [res, err] = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (err) {
            return wrapErr`${new SyncV1APIClient.ErrGetFullSync()} (${this._baseURL}): ${err}`
        }

        if (res.status === 401) {
            return wrapErr`${new SyncV1APIClient.ErrGetFullSync()} (${this._baseURL}): ${new UnauthorizedError()}`
        }

        if (res.status === 303) {
            let locHeader = res.headers.get("location")
            if (!locHeader) {
                return wrapErr`${new SyncV1APIClient.ErrGetFullSync()} (${this._baseURL}): error fetching full DB from sync server (${this._baseURL}): request returned status 303 but no Location header`
            }
            return this._downloadDBFromLocation(ctx, locHeader)
        }

        if (res.status !== 200) {
            let err = await APIError.fromHTTPResponse(res)
            return wrapErr`${new SyncV1APIClient.ErrGetFullSync()} (${this._baseURL}): ${err}`
        }

        let [data, receiveDataErr] = await fromPromise(res.arrayBuffer())
        if (receiveDataErr) {
            return wrapErr`${new SyncV1APIClient.ErrGetFullSync()} (${this._baseURL}): error reading data`
        }

        return Ok(data)
    }

    private async _downloadDBFromLocation(
        ctx: Context,
        location: string,
    ): AsyncResult<ArrayBufferLike> {
        let [req, createReqErr] = await this._createBaseRequest(ctx, "GET", location)
        if (createReqErr) {
            return Err(createReqErr)
        }

        let [res, err] = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (err) {
            return Err(err)
        }

        if (res.status === 401) {
            return wrapErr`error fetching full DB from sync server (${this._baseURL}): ${new UnauthorizedError()}`
        }

        if (res.status !== 200) {
            let err = await APIError.fromHTTPResponse(res)
            return Err(err.withPrefix(`error fetching full DB from sync server (${this._baseURL})`))
        }

        let [data, receiveDataErr] = await fromPromise(res.arrayBuffer())
        if (receiveDataErr) {
            return wrapErr`error fetching full DB from sync server (${this._baseURL}): error reading data: ${receiveDataErr}`
        }

        return Ok(data)
    }

    public static ErrUploadFullSyncData = createErrType(
        "SyncV1APIClient",
        "error uploading all data to sync server",
    )
    public async uploadFullSyncData(ctx: Context, data: ArrayBufferLike): AsyncResult<void> {
        let [req, createReqErr] = await this._createBaseRequest(
            ctx,
            "POST",
            "/api/sync/v1/full",
            new Uint8Array(data),
        )
        if (createReqErr) {
            return wrapErr`${new SyncV1APIClient.ErrUploadFullSyncData()} (${this._baseURL}): ${createReqErr}`
        }

        let [res, err] = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (err) {
            return wrapErr`${new SyncV1APIClient.ErrUploadFullSyncData()} (${this._baseURL}): ${err}`
        }

        if (res.status === 401) {
            return wrapErr`${new SyncV1APIClient.ErrUploadFullSyncData()} (${this._baseURL}): ${new UnauthorizedError()}`
        }

        if (res.status !== 201) {
            let err = await APIError.fromHTTPResponse(res)
            return wrapErr`${new SyncV1APIClient.ErrUploadFullSyncData()} (${this._baseURL}): ${err}`
        }

        return Ok()
    }

    public static ErrListChangelogEntries = createErrType(
        "SyncV1APIClient",
        "error listing changelog entries",
    )
    public async listChangelogEntries(
        ctx: Context,
        since?: Date,
    ): AsyncResult<EncryptedChangelogEntry[]> {
        let [req, createReqErr] = await this._createBaseRequest(
            ctx,
            "GET",
            `/api/sync/v1/changes?since=${JSON.parse(JSON.stringify(since ?? new Date(2000, 0, 1)))}`,
        )
        if (createReqErr) {
            return wrapErr`${new SyncV1APIClient.ErrListChangelogEntries()} (${this._baseURL}): ${createReqErr}`
        }

        let [res, err] = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (err) {
            return wrapErr`${new SyncV1APIClient.ErrListChangelogEntries()} (${this._baseURL}): ${err}`
        }

        if (res.status === 401) {
            return wrapErr`${new SyncV1APIClient.ErrListChangelogEntries()} (${this._baseURL}): ${new UnauthorizedError()}`
        }

        if (res.status !== 200) {
            let err = await APIError.fromHTTPResponse(res)
            return wrapErr`${new SyncV1APIClient.ErrListChangelogEntries()} (${this._baseURL}): ${err}`
        }

        let [data, receiveDataErr] = await fromPromise(res.text())
        if (receiveDataErr) {
            return wrapErr`${new SyncV1APIClient.ErrListChangelogEntries()} (${this._baseURL}): error reading data: ${receiveDataErr}`
        }

        return parseEncryptedChangelogEntryJSON(data)
    }

    public static ErrUploadChangelogEntries = createErrType(
        "SyncV1APIClient",
        "error uploading changelog entries to sync server",
    )
    public async uploadChangelogEntries(
        ctx: Context,
        entries: EncryptedChangelogEntry[],
    ): AsyncResult<void> {
        let [req, createReqErr] = await this._createBaseRequest(
            ctx,
            "POST",
            "/api/sync/v1/changes",
            JSON.stringify({ items: entries }),
        )
        if (createReqErr) {
            return wrapErr`${new SyncV1APIClient.ErrUploadChangelogEntries()} (${this._baseURL}): ${createReqErr}`
        }

        let [res, err] = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (err) {
            return wrapErr`${new SyncV1APIClient.ErrUploadChangelogEntries()} (${this._baseURL}): ${err}`
        }

        if (res.status === 401) {
            return wrapErr`${new SyncV1APIClient.ErrUploadChangelogEntries()} (${this._baseURL}): ${new UnauthorizedError()}`
        }

        if (res.status !== 201) {
            let err = await APIError.fromHTTPResponse(res)
            return wrapErr`${new SyncV1APIClient.ErrUploadChangelogEntries()} (${this._baseURL}): ${err}`
        }

        return Ok()
    }

    public static ErrUploadAttachment = createErrType(
        "SyncV1APIClient",
        "error uploading attachment",
    )
    public async uploadAttachment(
        ctx: Context,
        attachment: {
            filepath: string
            data: Uint8Array<ArrayBufferLike>
        },
    ): AsyncResult<void> {
        let [req, createReqErr] = await this._createBaseRequest(
            ctx,
            "POST",
            "/api/sync/v1/attachments",
            await compressData(attachment.data),
        )
        if (createReqErr) {
            return wrapErr`${new SyncV1APIClient.ErrUploadAttachment()} (${this._baseURL}): ${createReqErr}`
        }

        req.headers.set("X-Filepath", attachment.filepath)
        req.headers.set("Content-Type", "application/octet-stream")
        req.headers.set("Content-Encoding", "gzip")

        let [res, err] = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (err) {
            return wrapErr`${new SyncV1APIClient.ErrUploadAttachment()} (${this._baseURL}): ${err}`
        }

        if (res.status === 401) {
            return wrapErr`${new SyncV1APIClient.ErrUploadChangelogEntries()} (${this._baseURL})${new UnauthorizedError()}`
        }

        if (res.status !== 201) {
            let err = await APIError.fromHTTPResponse(res)
            return wrapErr`${new SyncV1APIClient.ErrUploadAttachment()} (${this._baseURL}): ${err}`
        }

        return Ok()
    }

    public static ErrGetAttachmentDataByFilepath = createErrType(
        "SyncV1APIClient",
        "error getting attachment",
    )
    public async getAttachmentDataByFilepath(
        ctx: Context,
        filepath: string,
    ): AsyncResult<ArrayBufferLike> {
        let [req, createReqErr] = await this._createBaseRequest(ctx, "GET", `/blobs${filepath}`)
        if (createReqErr) {
            return wrapErr`${new SyncV1APIClient.ErrGetAttachmentDataByFilepath()} (${this._baseURL}): ${filepath}: ${createReqErr}`
        }

        let [res, err] = await fromPromise(fetch(req, { signal: ctx.signal }))
        if (err) {
            return wrapErr`${new SyncV1APIClient.ErrGetAttachmentDataByFilepath()} (${this._baseURL}): ${filepath}: ${err}`
        }

        if (res.status === 401) {
            return wrapErr`$${new SyncV1APIClient.ErrGetAttachmentDataByFilepath()} (${this._baseURL}): ${filepath}: ${new UnauthorizedError()}`
        }

        if (res.status !== 200) {
            let err = await APIError.fromHTTPResponse(res)
            return wrapErr`${new SyncV1APIClient.ErrGetAttachmentDataByFilepath()} (${this._baseURL}): ${filepath}: ${err}`
        }

        return fromPromise(res.arrayBuffer())
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

function parseEncryptedChangelogEntryJSON(raw: string): Result<EncryptedChangelogEntry[]> {
    return fromThrowing(() => {
        let objs = JSON.parse(raw)
        let entries: EncryptedChangelogEntry[] = []

        for (let obj of objs.items) {
            let [timestamp, parseErr] = parseJSONDate(obj.timestamp)
            if (parseErr) {
                throw parseErr
            }
            entries.push({
                syncClientID: obj.syncClientID,
                data: obj.data,
                timestamp: timestamp,
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

async function streamToBlob(reader: ReadableStreamDefaultReader): Promise<Blob> {
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
