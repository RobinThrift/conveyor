import type { Attachment, AttachmentID } from "@/domain/Attachment"
import type {
    AttachmentChangelogEntry,
    ChangelogEntry,
} from "@/domain/Changelog"
import type { MemoID } from "@/domain/Memo"
import type { Context } from "@/lib/context"
import type { DBExec, Transactioner } from "@/lib/database"
import { type FS, FSNotFoundError, dirname } from "@/lib/fs"
import { mimeTypeForFilename } from "@/lib/mimeTypes"
import { type AsyncResult, Err, Ok, fmtErr } from "@/lib/result"

import { dataFromBase64, encodeToBase64 } from "@/lib/base64"

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
        let attachment = await this._repo.getAttachment(ctx, id)

        if (!attachment.ok) {
            return fmtErr(`error getting attachment: ${id}: %w`, attachment)
        }

        let read = await this._fs.read(ctx, attachment.value.filepath)
        if (!read.ok) {
            if (this._remote && read.err instanceof FSNotFoundError) {
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
        let writeResult = await this._writeAttachment(ctx, content)
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
                let created = await this._transactioner.inTransaction(
                    ctx,
                    (ctx) =>
                        this._repo.createAttachment(ctx, {
                            ...attachment,
                            id: entry.targetID,
                            sha256: dataFromBase64(attachment.sha256),
                        }),
                )
                if (!created.ok) {
                    return created
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

        let digest = await this._hasher.sum(ab)
        if (!digest.ok) {
            return digest
        }

        let sha256 = new Uint8Array(digest.value)

        let filepath = ""
        for (let b of sha256) {
            let h = b.toString(16)
            if (h.length < 2) {
                h = `0${h}`
            }
            filepath += `/${h}`
        }

        let mkdirpResult = await this._fs.mkdirp(ctx, dirname(filepath))
        if (!mkdirpResult.ok) {
            return mkdirpResult
        }

        let writeResult = await this._fs.write(ctx, filepath, content)
        if (!writeResult.ok) {
            return writeResult
        }

        return Ok({
            sha256,
            sizeBytes: content.byteLength,
            filepath,
        })
    }
}

interface Repo {
    getAttachment(
        ctx: Context<{ db?: DBExec }>,
        id: AttachmentID,
    ): AsyncResult<Attachment>

    createAttachment(
        ctx: Context<{ db?: DBExec }>,
        attachment: Omit<Attachment, "id" | "createdAt"> & {
            id?: AttachmentID
        },
    ): AsyncResult<Attachment>

    listAttachmentsForMemo(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
    ): AsyncResult<Attachment[]>

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
    getAttachmentDataByFilepath(
        ctx: Context,
        filepath: string,
    ): AsyncResult<ArrayBufferLike>
}

const attachmentPattern =
    /\[.*?\]\(attachment:\/\/(?<id>[A-Za-z0-9_-]{21}).*?\)/g

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
