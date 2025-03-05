import type { Attachment, AttachmentID } from "@/domain/Attachment"
import type {
    AttachmentChangelogEntry,
    ChangelogEntry,
} from "@/domain/Changelog"
import type { MemoID } from "@/domain/Memo"
import type { Context } from "@/lib/context"
import { type DBExec, type Database, withTx } from "@/lib/database"
import type { FS } from "@/lib/fs"
import { mimeTypeForFilename } from "@/lib/mimeTypes"
import { type AsyncResult, Err, Ok, fmtErr } from "@/lib/result"

import { writeAttachment } from "./fs"
import { FSErrNotFound } from "./fs/errors"
import { dataFromBase64, encodeToBase64 } from "@/lib/base64"

export class AttachmentStorage {
    private _db: Database
    private _repo: AttachmentRepo
    private _changelog: Changelog
    private _remote?: RemoteAttachmentStorage

    private _fs: FS

    constructor({
        db,
        fs,
        repo,
        changelog,
        remote,
    }: {
        db: Database
        repo: AttachmentRepo
        fs: FS
        changelog: Changelog
        remote?: RemoteAttachmentStorage
    }) {
        this._db = db
        this._repo = repo
        this._fs = fs
        this._changelog = changelog
        this._remote = remote
    }

    public async getAttachmentDataByID(
        ctx: Context<{ db?: DBExec }>,
        id: AttachmentID,
    ): AsyncResult<{ attachment: Attachment; data: ArrayBufferLike }> {
        let attachment = await this._repo.getAttachment(
            ctx.withData("db", this._db),
            id,
        )

        if (!attachment.ok) {
            return fmtErr(`error getting attachment: ${id}: %w`, attachment)
        }

        let read = await this._fs.read(ctx, attachment.value.filepath)
        if (!read.ok) {
            if (this._remote && read.err instanceof FSErrNotFound) {
                return this._getAttachmentDataFromRemote(ctx, attachment.value)
            }
            return fmtErr(`error getting attachment: ${id}: %w`, read)
        }

        return Ok({
            attachment: attachment.value,
            data: read.value,
        })
    }

    private async _getAttachmentDataFromRemote(
        ctx: Context,
        attachment: Attachment,
    ): AsyncResult<{ attachment: Attachment; data: ArrayBufferLike }> {
        if (!this._remote) {
            return Err(new Error("no remote fallback set"))
        }

        let fetched = await this._remote.getAttachmentDataByFilepath(
            ctx,
            attachment.filepath,
        )
        if (!fetched.ok) {
            return fmtErr("error getting attachment from remote: %w", fetched)
        }

        return Ok({
            attachment: attachment,
            data: fetched.value,
        })
    }

    public async createAttachment(
        ctx: Context<{ db?: DBExec }>,
        attachment: {
            id?: AttachmentID
            filename: string
            content: ArrayBufferLike
        },
    ): AsyncResult<AttachmentID> {
        return withTx(ctx, this._db, (ctx) =>
            this._createAttachment(ctx, attachment),
        )
    }

    private async _createAttachment(
        ctx: Context<{ db: DBExec }>,
        {
            id,
            filename,
            content,
        }: {
            id?: AttachmentID
            filename: string
            content: ArrayBufferLike
        },
    ): AsyncResult<AttachmentID> {
        let writeResult = await writeAttachment(ctx, this._fs, content)
        if (!writeResult.ok) {
            return writeResult
        }

        let created = await this._repo.createAttachment(ctx, {
            id,
            originalFilename: filename,
            contentType: mimeTypeForFilename(filename),
            filepath: writeResult.value.filepath,
            sha256: writeResult.value.sha256,
            sizeBytes: writeResult.value.sizeBytes,
        })
        if (!created.ok) {
            return created
        }

        let entryCreated = await this._changelog.createChangelogEntry(ctx, {
            revision: 1,
            targetType: "attachments",
            targetID: created.value.id,
            value: {
                created: {
                    originalFilename: filename,
                    contentType: mimeTypeForFilename(filename),
                    filepath: writeResult.value.filepath,
                    sha256: encodeToBase64(writeResult.value.sha256),
                    sizeBytes: writeResult.value.sizeBytes,
                },
            } satisfies AttachmentChangelogEntry["value"],
            isSynced: false,
            isApplied: true,
        })
        if (!entryCreated.ok) {
            return entryCreated
        }

        return Ok(created.value.id)
    }

    public async updateMemoAttachments(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
        content: string,
    ): AsyncResult<void> {
        return withTx(ctx, this._db, (ctx) =>
            this._updateMemoAttachments(ctx, memoID, content),
        )
    }

    private async _updateMemoAttachments(
        ctx: Context<{ db: DBExec }>,
        memoID: MemoID,
        content: string,
    ): AsyncResult<void> {
        let attachmentIDs = new Set(extractAttachmentIDs(content))

        let existingAttachments = await this._repo.listAttachmentsForMemo(
            ctx,
            memoID,
        )
        if (!existingAttachments.ok) {
            return fmtErr(
                "error updating memo attachments: error getting attachments for memo: %w",
                existingAttachments,
            )
        }

        let removed: AttachmentID[] = []
        for (let attachment of existingAttachments.value) {
            if (!attachmentIDs.has(attachment.id)) {
                removed.push(attachment.id)
            } else {
                attachmentIDs.delete(attachment.id)
            }
        }

        if (removed.length !== 0) {
            let deleted = await this._repo.deleteMemoAttachmentLinks(
                ctx,
                memoID,
                removed,
            )
            if (!deleted.ok) {
                return fmtErr(
                    "error updating memo attachments: error deleting memo attachment links: %w",
                    deleted,
                )
            }
        }

        for (let url of attachmentIDs) {
            let created = await this._repo.createMemoAttachmentLink(
                ctx,
                memoID,
                url,
            )
            if (!created.ok) {
                return fmtErr(
                    "error updating memo attachments: error creating memo attachment link: %w",
                    created,
                )
            }
        }

        return Ok(undefined)
    }

    public async listAttachmentsForMemo(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
    ): AsyncResult<Attachment[]> {
        return withTx(ctx, this._db, (ctx) =>
            this._repo.listAttachmentsForMemo(ctx, memoID),
        )
    }

    public async applyChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        entry: AttachmentChangelogEntry,
    ): AsyncResult<void> {
        if ("created" in entry.value) {
            let attachment = entry.value.created
            let created = await withTx(ctx, this._db, (ctx) =>
                this._repo.createAttachment(ctx, {
                    ...attachment,
                    id: entry.targetID,
                    sha256: dataFromBase64(attachment.sha256),
                }),
            )
            if (!created.ok) {
                return created
            }
            return Ok(undefined)
        }

        return Err(
            new Error(
                `error applying changelog entry to memo: unknown changelog type: ${JSON.stringify(entry.value)}`,
            ),
        )
    }
}

interface AttachmentRepo {
    getAttachment(
        ctx: Context<{ db: DBExec }>,
        id: AttachmentID,
    ): AsyncResult<Attachment>

    createAttachment(
        ctx: Context<{ db: DBExec }>,
        attachment: Omit<Attachment, "id" | "createdAt"> & {
            id?: AttachmentID
        },
    ): AsyncResult<Attachment>

    listAttachmentsForMemo(
        ctx: Context<{ db: DBExec }>,
        memoID: MemoID,
    ): AsyncResult<Attachment[]>

    deleteMemoAttachmentLinks(
        ctx: Context<{ db: DBExec }>,
        memoID: MemoID,
        attachmentIDs: AttachmentID[],
    ): AsyncResult<void>

    createMemoAttachmentLink(
        ctx: Context<{ db: DBExec }>,
        memoID: MemoID,
        attachmentID: AttachmentID,
    ): AsyncResult<void>
}

interface Changelog {
    createChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        entry: Omit<ChangelogEntry, "source" | "id" | "timestamp">,
    ): AsyncResult<void>
}

const attachmentPattern =
    /\[.*?\]\(attachment:\/\/(?<id>[A-Za-z0-9_-]{21}).*?\)/g

export function extractAttachmentIDs(content: string): string[] {
    let attachmentIDs: string[] = []

    attachmentPattern.lastIndex = 0
    let matches = attachmentPattern.exec(content)

    while (matches?.groups?.id) {
        attachmentIDs.push(matches.groups.id)
        matches = attachmentPattern.exec(content)
    }

    return attachmentIDs
}

interface RemoteAttachmentStorage {
    getAttachmentDataByFilepath(
        ctx: Context,
        filepath: string,
    ): AsyncResult<ArrayBufferLike>
}
