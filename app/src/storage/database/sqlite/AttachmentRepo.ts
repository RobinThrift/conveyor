import type { Attachment, AttachmentID } from "@/domain/Attachment"
import { newID } from "@/domain/ID"
import type { MemoID } from "@/domain/Memo"
import type { Context } from "@/lib/context"
import type { DBExec } from "@/lib/database"
import { currentDateTime } from "@/lib/i18n"
import { type AsyncResult, Err, fromPromise, Ok, wrapErr } from "@/lib/result"

import * as queries from "./gen/attachments_sql"

export class AttachmentRepo {
    private _db: DBExec

    constructor(db: DBExec) {
        this._db = db
    }

    public async getAttachment(
        ctx: Context<{ db?: DBExec }>,
        id: AttachmentID,
    ): AsyncResult<Attachment> {
        let [attachment, err] = await fromPromise(
            queries.getAttachment(
                ctx.getData("db", this._db),
                {
                    publicId: id,
                },
                ctx.signal,
            ),
        )

        if (err) {
            return wrapErr`error getting attachment: ${id}: ${err}`
        }

        if (attachment === null) {
            return Err(new Error(`error getting attachment: ${id}: not found`))
        }

        return Ok({
            id: attachment.publicId,
            contentType: attachment.contentType,
            filepath: attachment.filepath,
            originalFilename: attachment.originalFilename,
            sha256: attachment.sha256,
            sizeBytes: attachment.sizeBytes,
            createdAt: attachment.createdAt,
        } satisfies Attachment)
    }

    public async createAttachment(
        ctx: Context<{ db?: DBExec }>,
        attachment: Omit<Attachment, "id" | "createdAt"> & {
            id?: AttachmentID
        },
    ): AsyncResult<Attachment> {
        let createdAt = currentDateTime()

        let [created, err] = await fromPromise(
            queries.createAttachment(
                ctx.getData("db", this._db),
                {
                    publicId: attachment.id ?? newID(),
                    filepath: attachment.filepath ?? "",
                    originalFilename: attachment.originalFilename ?? "",
                    contentType: attachment.contentType ?? "",
                    sizeBytes: attachment.sizeBytes ?? 0,
                    sha256: attachment.sha256 ?? new Uint8Array(0),
                },
                ctx.signal,
            ),
        )

        if (err) {
            return wrapErr`error creating attachment: ${err}`
        }

        if (created === null) {
            return Err(new Error(`error creating attachment: ${attachment.originalFilename}`))
        }

        return Ok({
            ...attachment,
            createdAt,
            id: created.publicId,
        } satisfies Attachment)
    }

    public async listAttachmentsForMemo(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
    ): AsyncResult<Attachment[]> {
        let [rows, err] = await fromPromise(
            queries.listAttachmentsForMemo(
                ctx.getData("db", this._db),
                {
                    memoId: memoID,
                },
                ctx.signal,
            ),
        )
        if (err) {
            wrapErr`error listing attachments for memo: ${memoID}: ${err}`
        }

        return Ok(
            rows.map((r) => ({
                ...r,
                id: r.id.toString(),
            })),
        )
    }

    public async createMemoAttachmentLink(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
        attachmentID: AttachmentID,
    ): AsyncResult<void> {
        return fromPromise(
            queries.createMemoAttachmentLink(
                ctx.getData("db", this._db),
                {
                    memoId: memoID,
                    attachmentId: attachmentID,
                },
                ctx.signal,
            ),
        )
    }

    public async deleteMemoAttachmentLinks(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
        attachmentIDs: AttachmentID[],
    ): AsyncResult<void> {
        return fromPromise(
            queries.deleteMemoAttachmentLinks(
                ctx.getData("db", this._db),
                {
                    memoId: memoID,
                    attachmentIds: attachmentIDs,
                },
                ctx.signal,
            ),
        )
    }

    public async getAttachmentByFilepath(
        ctx: Context<{ db?: DBExec }>,
        filepath: string,
    ): AsyncResult<Attachment> {
        let [attachment, err] = await fromPromise(
            queries.getAttachmentByFilepath(ctx.getData("db", this._db), { filepath }, ctx.signal),
        )
        if (err) {
            return wrapErr`error getting attachment by filepath: ${filepath}: $err`
        }

        if (attachment === null) {
            return Err(new Error(`attachment not found for filepath: ${filepath}`))
        }

        return Ok({
            ...attachment,
            id: attachment.id.toString(),
        })
    }
}
