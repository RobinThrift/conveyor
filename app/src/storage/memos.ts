import type { ChangelogEntry, MemoContentChanges } from "@/domain/Changelog"
import type { ListMemosQuery, Memo, MemoID, MemoList } from "@/domain/Memo"
import type { Pagination } from "@/domain/Pagination"
import type { TagList } from "@/domain/Tag"
import type { Context } from "@/lib/context"
import { type DBExec, type Database, withTx } from "@/lib/database"
import type { AsyncResult } from "@/lib/result"

export type Filter = ListMemosQuery

export class MemoStorage {
    private _repo: MemoRepo
    private _db: Database
    private _attachments: MemoStorageAttachments
    private _changelog: MemoStorageChangelog

    constructor({
        db,
        repo,
        attachments,
        changelog,
    }: {
        db: Database
        repo: MemoRepo
        attachments: MemoStorageAttachments
        changelog: MemoStorageChangelog
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
                    version: "1",
                    changes: [[0, ...created.value.content.split("\n")]],
                },
                synced: false,
                applied: true,
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

            this._changelog.createChangelogEntry(ctx, {
                revision: 0,
                targetType: "memos",
                targetID: memo.id,
                value: memo.changes,
                synced: false,
                applied: true,
            })

            let res = await this._attachments.updateMemoAttachments(
                ctx,
                memo.id,
                memo.content,
            )
            if (!res.ok) {
                return res
            }

            return updated
        })
    }

    public async deleteMemo(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
    ): AsyncResult<void> {
        return withTx(ctx, this._db, async (ctx) =>
            this._repo.deleteMemo(ctx, memoID),
        )
    }

    public async undeleteMemo(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
    ): AsyncResult<void> {
        return withTx(ctx, this._db, async (ctx) =>
            this._repo.undeleteMemo(ctx, memoID),
        )
    }

    public async updateMemoArchiveStatus(
        ctx: Context<{ db?: DBExec }>,
        memo: { id: MemoID; isArchived: boolean },
    ): AsyncResult<void> {
        return withTx(ctx, this._db, (ctx) =>
            this._repo.updateMemoArchiveStatus(ctx, memo),
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

export interface CreateMemoRequest {
    content: string
    createdAt?: Date
}

export interface UpdateMemoContentRequest {
    id: MemoID
    content: string
    changes: MemoContentChanges
}

export interface ListTagsQuery {
    pageSize: number
    pageAfter?: string
}

export interface MemoRepo {
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
        memo: UpdateMemoContentRequest,
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

export interface MemoStorageAttachments {
    updateMemoAttachments(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
        content: string,
    ): AsyncResult<void>
}

export interface MemoStorageChangelog {
    createChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        entry: Omit<ChangelogEntry, "source">,
    ): AsyncResult<void>
}
