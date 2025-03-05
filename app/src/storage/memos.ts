import type {
    ChangelogEntry,
    MemoChangelogEntry,
    MemoContentChanges,
} from "@/domain/Changelog"
import type { ListMemosQuery, Memo, MemoID, MemoList } from "@/domain/Memo"
import type { Pagination } from "@/domain/Pagination"
import type { TagList } from "@/domain/Tag"
import { applyTextChanges } from "@/lib/applyTextChanges"
import type { Context } from "@/lib/context"
import { type DBExec, type Database, withTx } from "@/lib/database"
import { Err, Ok, type AsyncResult } from "@/lib/result"

export type Filter = ListMemosQuery

export class MemoStorage {
    private _repo: MemoRepo
    private _db: Database
    private _attachments: AttachmentStorage
    private _changelog: ChangelogStorage

    constructor({
        db,
        repo,
        attachments,
        changelog,
    }: {
        db: Database
        repo: MemoRepo
        attachments: AttachmentStorage
        changelog: ChangelogStorage
    }) {
        this._db = db
        this._repo = repo
        this._attachments = attachments
        this._changelog = changelog
    }

    public async getMemo(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
    ): AsyncResult<Memo> {
        return withTx(ctx, this._db, (ctx) => this._repo.getMemo(ctx, memoID))
    }

    public async listMemos(
        ctx: Context<{ db?: DBExec }>,
        {
            pagination,
            filter,
        }: {
            pagination: Pagination<Date>
            filter?: Filter
        },
    ): AsyncResult<MemoList> {
        return withTx(ctx, this._db, (ctx) =>
            this._repo.listMemos(ctx, { pagination, filter }),
        )
    }

    public async createMemo(
        ctx: Context<{ db?: DBExec }>,
        memo: CreateMemoRequest,
    ): AsyncResult<Memo> {
        return withTx(ctx, this._db, async (ctx) => {
            let created = await this._repo.createMemo(ctx, memo)
            if (!created.ok) {
                return created
            }

            let res = await this._attachments.updateMemoAttachments(
                ctx,
                created.value.id,
                created.value.content,
            )
            if (!res.ok) {
                return res
            }

            this._changelog.createChangelogEntry(ctx, {
                revision: 1,
                targetType: "memos",
                targetID: created.value.id,
                value: {
                    created: created.value,
                } satisfies MemoChangelogEntry["value"],
                isSynced: false,
                isApplied: true,
            })

            return created
        })
    }

    public async updateMemoContent(
        ctx: Context<{ db?: DBExec }>,
        memo: UpdateMemoContentRequest,
    ): AsyncResult<void> {
        return withTx(ctx, this._db, async (ctx) => {
            let updated = await this._repo.updateMemoContent(ctx, memo)

            if (!updated.ok) {
                return updated
            }

            let res = await this._attachments.updateMemoAttachments(
                ctx,
                memo.id,
                memo.content,
            )
            if (!res.ok) {
                return res
            }

            this._changelog.createChangelogEntry(ctx, {
                revision: 0,
                targetType: "memos",
                targetID: memo.id,
                value: {
                    content: memo.changes,
                } satisfies MemoChangelogEntry["value"],
                isSynced: false,
                isApplied: true,
            })

            return updated
        })
    }

    public async deleteMemo(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
    ): AsyncResult<void> {
        return withTx(ctx, this._db, async (ctx) => {
            let deleted = await this._repo.deleteMemo(ctx, memoID)
            if (!deleted.ok) {
                return deleted
            }

            return this._changelog.createChangelogEntry(ctx, {
                revision: 0,
                targetType: "memos",
                targetID: memoID,
                value: {
                    isDeleted: true,
                } satisfies MemoChangelogEntry["value"],
                isSynced: false,
                isApplied: true,
            })
        })
    }

    public async undeleteMemo(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
    ): AsyncResult<void> {
        return withTx(ctx, this._db, async (ctx) => {
            let undeleted = await this._repo.undeleteMemo(ctx, memoID)
            if (!undeleted.ok) {
                return undeleted
            }

            return this._changelog.createChangelogEntry(ctx, {
                revision: 0,
                targetType: "memos",
                targetID: memoID,
                value: {
                    isDeleted: false,
                } satisfies MemoChangelogEntry["value"],
                isSynced: false,
                isApplied: true,
            })
        })
    }

    public async updateMemoArchiveStatus(
        ctx: Context<{ db?: DBExec }>,
        memo: { id: MemoID; isArchived: boolean },
    ): AsyncResult<void> {
        return withTx(ctx, this._db, async (ctx) => {
            let updated = await this._repo.updateMemoArchiveStatus(ctx, memo)
            if (!updated.ok) {
                return updated
            }

            return this._changelog.createChangelogEntry(ctx, {
                revision: 0,
                targetType: "memos",
                targetID: memo.id,
                value: {
                    isArchived: memo.isArchived,
                } satisfies MemoChangelogEntry["value"],
                isSynced: false,
                isApplied: true,
            })
        })
    }

    public async applyChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        entry: MemoChangelogEntry,
    ): AsyncResult<void> {
        if ("created" in entry.value) {
        }

        let memo = await this._repo.getMemo(
            ctx.withData("db", this._db),
            entry.targetID,
        )
        if (!memo.ok) {
            return memo
        }

        if ("isArchived" in entry.value) {
            let isArchived = entry.value.isArchived
            return withTx(ctx, this._db, (ctx) =>
                this._repo.updateMemoArchiveStatus(ctx, {
                    id: memo.value.id,
                    isArchived,
                }),
            )
        }

        if ("isDeleted" in entry.value) {
            if (entry.value.isDeleted) {
                return withTx(ctx, this._db, (ctx) =>
                    this._repo.deleteMemo(ctx, memo.value.id),
                )
            }
            return withTx(ctx, this._db, (ctx) =>
                this._repo.undeleteMemo(ctx, memo.value.id),
            )
        }

        if ("content" in entry.value) {
            let content = applyTextChanges(
                memo.value.content,
                entry.value.content,
            )
            return withTx(ctx, this._db, async (ctx) => {
                let updated = await this._repo.updateMemoContent(ctx, {
                    id: memo.value.id,
                    content,
                })

                if (!updated.ok) {
                    return updated
                }

                let res = await this._attachments.updateMemoAttachments(
                    ctx,
                    memo.value.id,
                    content,
                )
                if (!res.ok) {
                    return res
                }

                return Ok(undefined)
            })
        }

        return Err(
            new Error(
                `error applying changelog entry to memo: unknown changelog type: ${JSON.stringify(entry.value)}`,
            ),
        )
    }

    public async listTags(
        ctx: Context<{ db?: DBExec }>,
        {
            pagination,
        }: {
            pagination: Pagination<string>
        },
    ): AsyncResult<TagList> {
        return withTx(ctx, this._db, (ctx) =>
            this._repo.listTags(ctx, { ...pagination }),
        )
    }

    public async cleanupDeletedMemos(
        ctx: Context<{ db?: DBExec }>,
    ): AsyncResult<unknown> {
        return withTx(ctx, this._db, (ctx) =>
            this._repo.cleanupDeletedMemos(ctx),
        )
    }
}

interface CreateMemoRequest {
    content: string
    createdAt?: Date
}

interface UpdateMemoContentRequest {
    id: MemoID
    content: string
    changes: MemoContentChanges
}

interface ListTagsQuery {
    pageSize: number
    pageAfter?: string
}

interface MemoRepo {
    getMemo(ctx: Context<{ db: DBExec }>, memoID: MemoID): AsyncResult<Memo>
    listMemos(
        ctx: Context<{ db: DBExec }>,
        {
            pagination,
            filter,
        }: {
            pagination: Pagination<Date>
            filter?: ListMemosQuery
        },
    ): AsyncResult<MemoList>

    createMemo(
        ctx: Context<{ db: DBExec }>,
        memo: CreateMemoRequest,
    ): AsyncResult<Memo>

    updateMemoContent(
        ctx: Context<{ db: DBExec }>,
        memo: {
            id: MemoID
            content: string
        },
    ): AsyncResult<void>

    updateMemoArchiveStatus(
        ctx: Context<{ db: DBExec }>,
        memo: { id: MemoID; isArchived: boolean },
    ): AsyncResult<void>

    deleteMemo(ctx: Context<{ db: DBExec }>, memoID: MemoID): AsyncResult<void>

    undeleteMemo(
        ctx: Context<{ db: DBExec }>,
        memoID: MemoID,
    ): AsyncResult<void>
    listTags(
        ctx: Context<{ db: DBExec }>,
        query: ListTagsQuery,
    ): AsyncResult<TagList>
    cleanupDeletedMemos(ctx: Context<{ db: DBExec }>): AsyncResult<number>
}

interface AttachmentStorage {
    updateMemoAttachments(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
        content: string,
    ): AsyncResult<void>
}

interface ChangelogStorage {
    createChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        entry: Omit<ChangelogEntry, "source" | "id" | "timestamp">,
    ): AsyncResult<void>
}
