import { ATTACHMENT_BASE_DIR, type Attachment, type AttachmentID } from "@/domain/Attachment"
import type { AttachmentChangelogEntry, ChangelogEntry } from "@/domain/Changelog"
import type { MemoID } from "@/domain/Memo"
import type { Context } from "@/lib/context"
import type { DBExec, Transactioner } from "@/lib/database"
import { type FS, FSNotFoundError, dirname, join } from "@/lib/fs"
import { mimeTypeForFilename } from "@/lib/mimeTypes"
import { type AsyncResult, Err, Ok, wrapErr } from "@/lib/result"

import { dataFromBase64, encodeToBase64 } from "@/lib/base64"
import { isErr } from "@/lib/errors"

export class AttachmentController {
    private _transactioner: Transactioner
    private _repo: Repo
    private _changelog: Changelog
    private _remote?: RemoteAttachmentStorage
    private _fs: FS
    private _hasher: Hasher

    constructor({
        transactioner,
        repo,
        fs,
        hasher,
        changelog,
        remote,
    }: {
        transactioner: Transactioner
        repo: Repo
        fs: FS
        hasher: Hasher
        changelog: Changelog
        remote?: RemoteAttachmentStorage
    }) {
        this._transactioner = transactioner
        this._repo = repo
        this._fs = fs
        this._hasher = hasher
        this._changelog = changelog
        this._remote = remote
    }

    public async getAttachmentDataByID(
        ctx: Context<{ db?: DBExec }>,
        id: AttachmentID,
    ): AsyncResult<{ attachment: Attachment; data: ArrayBufferLike }> {
        let [attachment, err] = await this._repo.getAttachment(ctx, id)

        if (err) {
            return wrapErr`error getting attachment: ${id}: ${err}`
        }

        let [data, readErr] = await this._fs.read(ctx, this._filepath(attachment.filepath))
        if (readErr) {
            if (this._remote && isErr(readErr, FSNotFoundError)) {
                return this._getAttachmentDataFromRemote(ctx, attachment)
            }
            return wrapErr`error getting attachment: ${id}: ${readErr}`
        }

        return Ok({
            attachment,
            data,
        })
    }

    public async getAttachmentByID(
        ctx: Context<{ db?: DBExec }>,
        id: AttachmentID,
    ): AsyncResult<Attachment> {
        let [attachment, err] = await this._repo.getAttachment(ctx, id)

        if (err) {
            return wrapErr`error getting attachment: ${id}: ${err}`
        }

        return Ok(attachment)
    }

    private async _getAttachmentDataFromRemote(
        ctx: Context,
        attachment: Attachment,
    ): AsyncResult<{ attachment: Attachment; data: ArrayBufferLike }> {
        if (!this._remote) {
            return Err(new Error("no remote fallback set"))
        }

        let [fetched, fetchErr] = await this._remote.getAttachmentDataByFilepath(
            ctx,
            attachment.filepath,
        )
        if (fetchErr) {
            return wrapErr`error getting attachment from remote: ${fetchErr}`
        }

        let [_mkdirp, mkdirpErr] = await this._fs.mkdirp(
            ctx,
            this._filepath(dirname(attachment.filepath)),
        )
        if (mkdirpErr) {
            return Err(mkdirpErr)
        }

        let [_write, writeErr] = await this._fs.write(
            ctx,
            this._filepath(attachment.filepath),
            fetched,
        )
        if (writeErr) {
            return Err(writeErr)
        }

        return Ok({
            attachment,
            data: fetched,
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
        return this._transactioner.inTransaction(ctx, async (ctx) =>
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
        let [attachment, writeErr] = await this._writeAttachment(ctx, content)
        if (writeErr) {
            return Err(writeErr)
        }

        let [created, createErr] = await this._repo.createAttachment(ctx, {
            id,
            originalFilename: filename,
            contentType: mimeTypeForFilename(filename),
            filepath: attachment.filepath,
            sha256: attachment.sha256,
            sizeBytes: attachment.sizeBytes,
        })
        if (createErr) {
            return Err(createErr)
        }

        let [_entryCreate, entryCreateErr] = await this._changelog.createChangelogEntry(ctx, {
            revision: 1,
            targetType: "attachments",
            targetID: created.id,
            value: {
                created: {
                    originalFilename: filename,
                    contentType: mimeTypeForFilename(filename),
                    filepath: attachment.filepath,
                    sha256: encodeToBase64(attachment.sha256),
                    sizeBytes: attachment.sizeBytes,
                },
            } satisfies AttachmentChangelogEntry["value"],
            isSynced: false,
            isApplied: true,
        })
        if (entryCreateErr) {
            return Err(entryCreateErr)
        }

        return Ok(created.id)
    }

    public async updateMemoAttachments(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
        content: string,
    ): AsyncResult<void> {
        return this._transactioner.inTransaction(ctx, (ctx) =>
            this._updateMemoAttachments(ctx, memoID, content),
        )
    }

    private async _updateMemoAttachments(
        ctx: Context<{ db: DBExec }>,
        memoID: MemoID,
        content: string,
    ): AsyncResult<void> {
        let attachmentIDs = new Set(extractAttachmentIDs(content))

        let [existingAttachments, listAttachmentsErr] = await this._repo.listAttachmentsForMemo(
            ctx,
            memoID,
        )
        if (listAttachmentsErr) {
            return wrapErr`error updating memo attachments: error getting attachments for memo: ${listAttachmentsErr}`
        }

        let removed: AttachmentID[] = []
        for (let attachment of existingAttachments) {
            if (!attachmentIDs.has(attachment.id)) {
                removed.push(attachment.id)
            } else {
                attachmentIDs.delete(attachment.id)
            }
        }

        if (removed.length !== 0) {
            let [_, err] = await this._repo.deleteMemoAttachmentLinks(ctx, memoID, removed)
            if (err) {
                return wrapErr`error updating memo attachments: error deleting memo attachment links: ${err}`
            }
        }

        for (let url of attachmentIDs) {
            let [_, err] = await this._repo.createMemoAttachmentLink(ctx, memoID, url)
            if (err) {
                return wrapErr`error updating memo attachments: error creating memo attachment link: ${err}`
            }
        }

        return Ok()
    }

    public async listAttachmentsForMemo(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
    ): AsyncResult<Attachment[]> {
        return this._transactioner.inTransaction(ctx, (ctx) =>
            this._repo.listAttachmentsForMemo(ctx, memoID),
        )
    }

    public async applyChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        entries: AttachmentChangelogEntry[],
    ): AsyncResult<void> {
        for (let entry of entries) {
            if ("created" in entry.value) {
                let attachment = entry.value.created
                let [_, err] = await this._transactioner.inTransaction(ctx, (ctx) => {
                    let [sha256, sha256Err] = dataFromBase64(attachment.sha256)
                    if (sha256Err) {
                        return Promise.resolve(Err(sha256Err))
                    }

                    return this._repo.createAttachment(ctx, {
                        ...attachment,
                        id: entry.targetID,
                        sha256,
                    })
                })
                if (err) {
                    return Err(err)
                }
                continue
            }

            return Err(
                new Error(
                    `error applying changelog entry to memo: unknown changelog type: ${JSON.stringify(entry.value)}`,
                ),
            )
        }

        return Ok(undefined)
    }

    private async _writeAttachment(
        ctx: Context,
        content: ArrayBufferLike,
    ): AsyncResult<{
        sizeBytes: number
        sha256: Uint8Array<ArrayBufferLike>
        filepath: string
    }> {
        let ab = new ArrayBuffer(content.byteLength)
        new Uint8Array(ab).set(new Uint8Array(content), 0)

        let [digest, digestErr] = await this._hasher.sum(ab)
        if (digestErr) {
            return Err(digestErr)
        }

        let sha256 = new Uint8Array(digest)

        let filepath = ""
        for (let b of sha256) {
            let h = b.toString(16)
            if (h.length < 2) {
                h = `0${h}`
            }
            filepath += `/${h}`
        }

        let [_, mkdirpErr] = await this._fs.mkdirp(ctx, this._filepath(dirname(filepath)))
        if (mkdirpErr) {
            return Err(mkdirpErr)
        }

        let [_write, writeErr] = await this._fs.write(ctx, this._filepath(filepath), content)
        if (writeErr) {
            return Err(writeErr)
        }

        return Ok({
            sha256,
            sizeBytes: content.byteLength,
            filepath,
        })
    }

    private _filepath(filepath: string): string {
        return join(ATTACHMENT_BASE_DIR, filepath)
    }
}

interface Repo {
    getAttachment(ctx: Context<{ db?: DBExec }>, id: AttachmentID): AsyncResult<Attachment>

    createAttachment(
        ctx: Context<{ db?: DBExec }>,
        attachment: Omit<Attachment, "id" | "createdAt"> & {
            id?: AttachmentID
        },
    ): AsyncResult<Attachment>

    listAttachmentsForMemo(ctx: Context<{ db?: DBExec }>, memoID: MemoID): AsyncResult<Attachment[]>

    deleteMemoAttachmentLinks(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
        attachmentIDs: AttachmentID[],
    ): AsyncResult<void>

    createMemoAttachmentLink(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
        attachmentID: AttachmentID,
    ): AsyncResult<void>
}

interface Hasher {
    sum(data: BufferSource): AsyncResult<ArrayBufferLike>
}

interface Changelog {
    createChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        entry: Omit<ChangelogEntry, "source" | "id" | "timestamp">,
    ): AsyncResult<void>
}

interface RemoteAttachmentStorage {
    getAttachmentDataByFilepath(ctx: Context, filepath: string): AsyncResult<ArrayBufferLike>
}

const attachmentPattern = /\[.*?\]\(attachment:\/\/(?<id>[A-Za-z0-9_-]{21}).*?\)/g

function extractAttachmentIDs(content: string): string[] {
    let attachmentIDs: string[] = []

    attachmentPattern.lastIndex = 0
    let matches = attachmentPattern.exec(content)

    while (matches?.groups?.id) {
        attachmentIDs.push(matches.groups.id)
        matches = attachmentPattern.exec(content)
    }

    return attachmentIDs
}

if (import.meta.vitest) {
    const { test, assert } = import.meta.vitest

    test.concurrent.each([
        [
            "No Attachments",
            {
                input: `# Memo with no Attachments
This just some test content.`,
                expected: [],
            },
        ],
        [
            "Plain URL",
            {
                input: `# Memo with Plain URL
Memo with a plain URL: attachment://hT6XtCfBjyAukyiLqP9Th
`,
                expected: [],
            },
        ],
        [
            "Single Image",
            {
                input: `# Memo with Single Image
![Alt for img_a](attachment://KOg6Le_xr5wyYMHoru2kK?thumbhash=IAiCAYAniIaIh48AAAAAAJioh4eAhyc=)
`,
                expected: ["KOg6Le_xr5wyYMHoru2kK"],
            },
        ],
        [
            "Two Images",
            {
                input: `# Memo with Two Images
![Alt for img_a](attachment://KOg6Le_xr5wyYMHoru2kK?thumbhash=IAiCAYAniIaIh48AAAAAAJioh4eAhyc=)
Some mor test
![Alt for img_b](attachment://NNGFChDai3n7chWlKQ3wC?thumbhash=Hs2BAYAniZqKeH8fbWLX9pioh4eAhyc=)
`,
                expected: ["KOg6Le_xr5wyYMHoru2kK", "NNGFChDai3n7chWlKQ3wC"],
            },
        ],
        [
            "Single File",
            {
                input: `# Memo with a Signle File
Some text referencing: 
[text for filename_a](attachment://oxfMwRLYYvXV6bCPeogm7)
`,
                expected: ["oxfMwRLYYvXV6bCPeogm7"],
            },
        ],
        [
            "Two Files",
            {
                input: `# Memo with a Two Files
Some text referencing:
[text for filename_a](attachment://oxfMwRLYYvXV6bCPeogm7)
And some more prose with regards to [filename_b](attachment://EdckfatXNS7KYKQwa8R2X)
`,
                expected: ["oxfMwRLYYvXV6bCPeogm7", "EdckfatXNS7KYKQwa8R2X"],
            },
        ],
        [
            "Image and File mixed",
            {
                input: `# Memo with Images and Files
Some text referencing:
[text for filename_a](attachment://oxfMwRLYYvXV6bCPeogm7)

Please see the attached image: ![Alt for img_a](attachment://KOg6Le_xr5wyYMHoru2kK?thumbhash=IAiCAYAniIaIh48AAAAAAJioh4eAhyc=)

And some more prose with regards to [filename_b](attachment://EdckfatXNS7KYKQwa8R2X)
`,
                expected: [
                    "oxfMwRLYYvXV6bCPeogm7",
                    "KOg6Le_xr5wyYMHoru2kK",
                    "EdckfatXNS7KYKQwa8R2X",
                ],
            },
        ],
    ])("%s", (_, { input, expected }) => {
        let actual = extractAttachmentIDs(input)
        assert.deepEqual(actual, expected)
    })
}
