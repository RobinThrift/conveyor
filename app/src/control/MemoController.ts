import type {
    ChangelogEntry,
    MemoChangelogEntry,
    MemoContentChanges,
} from "@/domain/Changelog"
import type { ListMemosQuery, Memo, MemoID, MemoList } from "@/domain/Memo"
import type { Pagination } from "@/domain/Pagination"
import type { TagList } from "@/domain/Tag"
import type { Context } from "@/lib/context"
import type { DBExec, Transactioner } from "@/lib/database"
import { mergeChanges, resolveChanges } from "@/lib/diff"
import { type AsyncResult, Err, Ok } from "@/lib/result"

export type Filter = ListMemosQuery

export class MemoController {
    private _transactioner: Transactioner
    private _repo: Repo
    private _attachments: Attachments
    private _changelog: Changelog

    constructor({
        transactioner,
        repo,
        attachments,
        changelog,
    }: {
        transactioner: Transactioner
        repo: Repo
        attachments: Attachments
        changelog: Changelog
    }) {
        this._transactioner = transactioner
        this._repo = repo
        this._attachments = attachments
        this._changelog = changelog
    }

    public async getMemo(ctx: Context, memoID: MemoID): AsyncResult<Memo> {
        return this._transactioner.inTransaction(ctx, (ctx) =>
            this._repo.getMemo(ctx, memoID),
        )
    }

    public async listMemos(
        ctx: Context,
        {
            pagination,
            filter,
        }: {
            pagination: Pagination<Date>
            filter?: Filter
        },
    ): AsyncResult<MemoList> {
        return this._transactioner.inTransaction(ctx, (ctx) =>
            this._repo.listMemos(ctx, { pagination, filter }),
        )
    }

    public async createMemo(
        ctx: Context,
        memo: CreateMemoRequest,
    ): AsyncResult<Memo> {
        return this._transactioner.inTransaction(ctx, async (ctx) => {
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
        ctx: Context,
        memo: UpdateMemoContentRequest,
    ): AsyncResult<void> {
        return this._transactioner.inTransaction(ctx, async (ctx) => {
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

    public async deleteMemo(ctx: Context, memoID: MemoID): AsyncResult<void> {
        return this._transactioner.inTransaction(ctx, async (ctx) => {
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

    public async undeleteMemo(ctx: Context, memoID: MemoID): AsyncResult<void> {
        return this._transactioner.inTransaction(ctx, async (ctx) => {
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
        ctx: Context,
        memo: { id: MemoID; isArchived: boolean },
    ): AsyncResult<void> {
        return this._transactioner.inTransaction(ctx, async (ctx) => {
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

    public async applyChangelogEntries(
        ctx: Context,
        entries: MemoChangelogEntry[],
    ): AsyncResult<void> {
        let skip = new Set<MemoID>()

        for (let entry of entries) {
            if ("content" in entry.value && skip.has(entry.targetID)) {
                continue
            }

            if ("content" in entry.value) {
                skip.add(entry.targetID)
            }

            let applied = await this._applyChangelogEntry(ctx, entry)
            if (!applied.ok) {
                return applied
            }
        }

        return Ok(undefined)
    }

    private async _applyChangelogEntry(
        ctx: Context,
        entry: MemoChangelogEntry,
    ): AsyncResult<void> {
        if ("created" in entry.value) {
            let created = await this._repo.createMemo(ctx, {
                ...entry.value.created,
                id: entry.targetID,
            })
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

            return Ok(undefined)
        }

        let memo = await this._repo.getMemo(ctx, entry.targetID)
        if (!memo.ok) {
            return memo
        }

        if ("isArchived" in entry.value) {
            let isArchived = entry.value.isArchived
            return this._transactioner.inTransaction(ctx, (ctx) =>
                this._repo.updateMemoArchiveStatus(ctx, {
                    id: memo.value.id,
                    isArchived,
                }),
            )
        }

        if ("isDeleted" in entry.value) {
            if (entry.value.isDeleted) {
                return this._transactioner.inTransaction(ctx, (ctx) =>
                    this._repo.deleteMemo(ctx, memo.value.id),
                )
            }
            return this._transactioner.inTransaction(ctx, (ctx) =>
                this._repo.undeleteMemo(ctx, memo.value.id),
            )
        }

        if ("content" in entry.value) {
            return this._applyMemoContentChangelogEntry(ctx, memo.value)
        }

        return Err(
            new Error(
                `error applying changelog entry to memo: unknown changelog type: ${JSON.stringify(entry.value)}`,
            ),
        )
    }

    private async _applyMemoContentChangelogEntry(
        ctx: Context,
        memo: Memo,
    ): AsyncResult<void> {
        let entries =
            await this._changelog.listChangelogEntriesForID<MemoChangelogEntry>(
                ctx,
                memo.id,
            )
        if (!entries.ok) {
            return entries
        }

        let { changes } = mergeChanges(entries.value)

        let content = resolveChanges(changes)

        return this._transactioner.inTransaction(ctx, async (ctx) => {
            let updated = await this._repo.updateMemoContent(ctx, {
                id: memo.id,
                content,
            })

            if (!updated.ok) {
                return updated
            }

            let res = await this._attachments.updateMemoAttachments(
                ctx,
                memo.id,
                content,
            )
            if (!res.ok) {
                return res
            }

            return Ok(undefined)
        })
    }

    public async listTags(
        ctx: Context,
        {
            pagination,
        }: {
            pagination: Pagination<string>
        },
    ): AsyncResult<TagList> {
        return this._repo.listTags(ctx, { ...pagination })
    }

    public async cleanupDeletedMemos(ctx: Context): AsyncResult<unknown> {
        return this._repo.cleanupDeletedMemos(ctx)
    }
}

export interface CreateMemoRequest {
    content: string
    createdAt?: Date
    id?: MemoID
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

interface Repo {
    getMemo(ctx: Context<{ db?: DBExec }>, memoID: MemoID): AsyncResult<Memo>
    listMemos(
        ctx: Context<{ db?: DBExec }>,
        {
            pagination,
            filter,
        }: {
            pagination: Pagination<Date>
            filter?: ListMemosQuery
        },
    ): AsyncResult<MemoList>

    createMemo(
        ctx: Context<{ db?: DBExec }>,
        memo: CreateMemoRequest,
    ): AsyncResult<Memo>

    updateMemoContent(
        ctx: Context<{ db?: DBExec }>,
        memo: {
            id: MemoID
            content: string
        },
    ): AsyncResult<void>

    updateMemoArchiveStatus(
        ctx: Context<{ db?: DBExec }>,
        memo: { id: MemoID; isArchived: boolean },
    ): AsyncResult<void>

    deleteMemo(ctx: Context<{ db: DBExec }>, memoID: MemoID): AsyncResult<void>

    undeleteMemo(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
    ): AsyncResult<void>
    listTags(
        ctx: Context<{ db?: DBExec }>,
        query: ListTagsQuery,
    ): AsyncResult<TagList>
    cleanupDeletedMemos(ctx: Context<{ db?: DBExec }>): AsyncResult<number>
}

interface Attachments {
    updateMemoAttachments(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
        content: string,
    ): AsyncResult<void>
}

interface Changelog {
    createChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        entry: Omit<ChangelogEntry, "source" | "id" | "timestamp">,
    ): AsyncResult<void>
    listChangelogEntriesForID<C extends ChangelogEntry>(
        ctx: Context<{ db?: DBExec }>,
        targetID: string,
    ): AsyncResult<C[]>
}
