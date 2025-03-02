import type { Attachment, AttachmentID } from "@/domain/Attachment"
import type { MemoID } from "@/domain/Memo"
import type { Context } from "@/lib/context"
import {
    type AsyncResult,
    Err,
    ErrAsync,
    Ok,
    fromPromise,
    mapResult,
} from "@/lib/result"

import { newID } from "@/domain/ID"
import type { DBExec } from "@/lib/database"
import * as queries from "./gen/attachments_sql"

export async function getAttachment(
    ctx: Context<{ db: DBExec }>,
    id: AttachmentID,
): AsyncResult<Attachment> {
    let result = await fromPromise(
        queries.getAttachment(
            ctx.data.db,
            {
                publicId: id,
            },
            ctx.signal,
        ),
    )

    if (!result.ok) {
        return result
    }

    if (result.value === null) {
        return Err(new Error(`error getting attachment: ${id}`))
    }

    return Ok({
        ...result.value,
        id: result.value.publicId,
    } satisfies Attachment)
}

export async function createAttachment(
    ctx: Context<{ db: DBExec }>,
    attachment: Omit<Attachment, "id" | "createdAt"> & { id?: AttachmentID },
): AsyncResult<Attachment> {
    let createdAt = new Date()

    let result = await fromPromise(
        queries.createAttachment(
            ctx.data.db,
            {
                publicId: attachment.id ?? newID(),
                filepath: attachment.filepath,
                originalFilename: attachment.originalFilename,
                contentType: attachment.contentType,
                sizeBytes: attachment.sizeBytes,
                sha256: attachment.sha256,
            },
            ctx.signal,
        ),
    )

    if (!result.ok) {
        return result
    }

    if (result.value === null) {
        return Err(
            new Error(
                `error creating attachment: ${attachment.originalFilename}`,
            ),
        )
    }

    return Ok({
        ...attachment,
        createdAt,
        id: result.value.publicId,
    } satisfies Attachment)
}

export async function listAttachmentsForMemo(
    ctx: Context<{ db: DBExec }>,
    memoID: MemoID,
): AsyncResult<Attachment[]> {
    let result = await fromPromise(
        queries.listAttachmentsForMemo(
            ctx.data.db,
            {
                memoId: memoID,
            },
            ctx.signal,
        ),
    )

    return mapResult(result, (rows) =>
        rows.map((r) => ({
            ...r,
            id: r.id.toString(),
        })),
    )
}

export async function createMemoAttachmentLink(
    ctx: Context<{ db: DBExec }>,
    memoID: MemoID,
    attachmentID: AttachmentID,
): AsyncResult<void> {
    return fromPromise(
        queries.createMemoAttachmentLink(
            ctx.data.db,
            {
                memoId: memoID,
                attachmentId: attachmentID,
            },
            ctx.signal,
        ),
    )
}

export async function deleteMemoAttachmentLinks(
    ctx: Context<{ db: DBExec }>,
    memoID: MemoID,
    attachmentIDs: AttachmentID[],
): AsyncResult<void> {
    return fromPromise(
        queries.deleteMemoAttachmentLinks(
            ctx.data.db,
            {
                memoId: memoID,
                attachmentIds: attachmentIDs,
            },
            ctx.signal,
        ),
    )
}

export async function getAttachmentByFilepath(
    ctx: Context<{ db: DBExec }>,
    filepath: string,
): AsyncResult<Attachment> {
    let res = await fromPromise(
        queries.getAttachmentByFilepath(ctx.data.db, { filepath }, ctx.signal),
    )
    if (!res.ok) {
        return res
    }

    if (res.value === null) {
        return ErrAsync(
            new Error(`attachment not found for filepath: ${filepath}`),
        )
    }

    return Ok({
        ...res.value,
        id: res.value.id.toString(),
    })
}
