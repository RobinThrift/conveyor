import type { ChangelogEntry, MemoChangelogEntry, MemoContentChanges } from "@/domain/Changelog"
import {
    ErrMemoNotFound,
    type ListMemosQuery,
    type Memo,
    type MemoID,
    type MemoList,
} from "@/domain/Memo"
import type { Pagination } from "@/domain/Pagination"
import type { TagList } from "@/domain/Tag"
import type { Context } from "@/lib/context"
import type { DBExec, Transactioner } from "@/lib/database"
import { mergeChanges, resolveChanges } from "@/lib/diff"
import { createErrType, isErr } from "@/lib/errors"
import { queueTask } from "@/lib/microtask"
import { type AsyncResult, Err, Ok, wrapErr } from "@/lib/result"

export type Filter = ListMemosQuery

type OnMemoChangeHandler = (data: { memo: Memo }) => void
type OnMemoCreatedHandler = (data: { memo: Memo }) => void

export class MemoController {
    private _transactioner: Transactioner
    private _repo: Repo
    private _attachments: Attachments
    private _changelog: Changelog

    private _events = {
        onMemoCreated: [] as OnMemoCreatedHandler[],
        onMemoChange: [] as OnMemoChangeHandler[],
    }

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

    public addEventListener(event: "onMemoCreated", cb: OnMemoCreatedHandler): () => void
    public addEventListener(event: "onMemoChange", cb: OnMemoChangeHandler): () => void
    public addEventListener(
        event: "onMemoChange" | "onMemoCreated",
        cb: OnMemoChangeHandler | OnMemoCreatedHandler,
    ): () => void {
        this._events[event].push(cb)
        return () => {
            this._events[event] = this._events[event].filter((i) => cb !== i)
        }
    }

    public static ErrGetMemo = createErrType("MemoController", "error getting memo")
    public async getMemo(ctx: Context, memoID: MemoID): AsyncResult<Memo> {
        let [memo, err] = await this._transactioner.inTransaction(ctx, (ctx) =>
            this._repo.getMemo(ctx, memoID),
        )
        if (err) {
            if (isErr(err, ErrMemoNotFound)) {
                return wrapErr`${new MemoController.ErrGetMemo()}: ${err}`
            }

            return wrapErr`${new MemoController.ErrGetMemo()}: ${memoID}: ${err}`
        }

        return Ok(memo)
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

    public static ErrCreateMemo = createErrType("MemoController", "error creating memo")
    public async createMemo(ctx: Context, memo: CreateMemoRequest): AsyncResult<Memo> {
        return this._transactioner.inTransaction(ctx, async (ctx) => {
            let [created, err] = await this._repo.createMemo(ctx, memo)
            if (err) {
                return wrapErr`${new MemoController.ErrCreateMemo()}: ${err}`
            }

            let [, updateAttachmentsErr] = await this._attachments.updateMemoAttachments(
                ctx,
                created.id,
                created.content,
            )
            if (updateAttachmentsErr) {
                return wrapErr`${new MemoController.ErrCreateMemo()}: ${updateAttachmentsErr}`
            }

            this._changelog.createChangelogEntry(ctx, {
                revision: 1,
                targetType: "memos",
                targetID: created.id,
                value: {
                    created: created,
                } satisfies MemoChangelogEntry["value"],
                isSynced: false,
                isApplied: true,
            })

            return Ok(created)
        })
    }

    public static ErrUpdateMemoContent = createErrType(
        "MemoController",
        "error updating memo content",
    )
    public async updateMemoContent(
        ctx: Context,
        memo: UpdateMemoContentRequest,
    ): AsyncResult<void> {
        return this._transactioner.inTransaction(ctx, async (ctx) => {
            let [updated, updateErr] = await this._repo.updateMemoContent(ctx, memo)
            if (updateErr) {
                return wrapErr`${new MemoController.ErrUpdateMemoContent()}: ${updateErr}`
            }

            let [_, updateAttachmentsErr] = await this._attachments.updateMemoAttachments(
                ctx,
                memo.id,
                memo.content,
            )
            if (updateAttachmentsErr) {
                return wrapErr`${new MemoController.ErrUpdateMemoContent()}: ${updateAttachmentsErr}`
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

            return Ok(updated)
        })
    }

    public static ErrDeleteMemo = createErrType("MemoController", "error deleting memo")
    public async deleteMemo(ctx: Context, memoID: MemoID): AsyncResult<void> {
        return this._transactioner.inTransaction(ctx, async (ctx) => {
            let [_, err] = await this._repo.deleteMemo(ctx, memoID)
            if (err) {
                return wrapErr`${new MemoController.ErrDeleteMemo()}: ${err}`
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

    public static ErrUndeleteMemo = createErrType("MemoController", "error undeleting memo")
    public async undeleteMemo(ctx: Context, memoID: MemoID): AsyncResult<void> {
        return this._transactioner.inTransaction(ctx, async (ctx) => {
            let [_, err] = await this._repo.undeleteMemo(ctx, memoID)
            if (err) {
                return wrapErr`${new MemoController.ErrUndeleteMemo()}: ${err}`
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

    public static ErrUpdateMemoArchiveStatus = createErrType(
        "MemoController",
        "error updating memo archive status",
    )
    public async updateMemoArchiveStatus(
        ctx: Context,
        memo: { id: MemoID; isArchived: boolean },
    ): AsyncResult<void> {
        return this._transactioner.inTransaction(ctx, async (ctx) => {
            let [_, err] = await this._repo.updateMemoArchiveStatus(ctx, memo)
            if (err) {
                return wrapErr`${new MemoController.ErrUpdateMemoArchiveStatus()}: ${err}`
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

    public static ErrApplyingChangelogEntries = createErrType(
        "MemoController",
        "error applying changelog entries",
    )
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

            let [_, err] = await this._applyChangelogEntry(ctx, entry)
            if (err) {
                return wrapErr`${new MemoController.ErrApplyingChangelogEntries()}: ${err}`
            }
        }

        return Ok()
    }

    private async _applyChangelogEntry(ctx: Context, entry: MemoChangelogEntry): AsyncResult<void> {
        if ("created" in entry.value) {
            let [created, err] = await this._repo.createMemo(ctx, {
                ...entry.value.created,
                id: entry.targetID,
            })
            if (err) {
                return wrapErr`error creating memo: ${err}`
            }

            let [_, updateAttachmentsErr] = await this._attachments.updateMemoAttachments(
                ctx,
                created.id,
                created.content,
            )
            if (updateAttachmentsErr) {
                return Err(updateAttachmentsErr)
            }

            this._triggerEvent("onMemoCreated", {
                memo: {
                    ...entry.value.created,
                    id: entry.targetID,
                },
            })

            return Ok()
        }

        let [memo, err] = await this._repo.getMemo(ctx, entry.targetID)
        if (err) {
            return wrapErr`error getting memo: ${entry.targetID}: ${err}`
        }

        if ("isArchived" in entry.value) {
            let isArchived = entry.value.isArchived
            return this._transactioner.inTransaction(ctx, (ctx) =>
                this._repo.updateMemoArchiveStatus(ctx, {
                    id: memo.id,
                    isArchived,
                }),
            )
        }

        if ("isDeleted" in entry.value) {
            if (entry.value.isDeleted) {
                return this._transactioner.inTransaction(ctx, (ctx) =>
                    this._repo.deleteMemo(ctx, memo.id),
                )
            }
            return this._transactioner.inTransaction(ctx, (ctx) =>
                this._repo.undeleteMemo(ctx, memo.id),
            )
        }

        if ("content" in entry.value) {
            return this._applyMemoContentChangelogEntry(ctx, memo)
        }

        return wrapErr`error applying changelog entry to memo: unknown changelog type: ${JSON.stringify(entry.value)}`
    }

    private async _applyMemoContentChangelogEntry(ctx: Context, memo: Memo): AsyncResult<void> {
        let [entries, err] = await this._changelog.listChangelogEntriesForID<MemoChangelogEntry>(
            ctx,
            memo.id,
        )
        if (err) {
            return Err(err)
        }

        let { changes } = mergeChanges(entries)

        let content = resolveChanges(changes)

        let [_, txErr] = await this._transactioner.inTransaction(ctx, async (ctx) => {
            let [_, updateErr] = await this._repo.updateMemoContent(ctx, {
                id: memo.id,
                content,
            })

            if (updateErr) {
                return wrapErr`error updating memo content: ${memo.id}: ${updateErr}`
            }

            let [_updateAttachments, updateAttachmentsErr] =
                await this._attachments.updateMemoAttachments(ctx, memo.id, content)
            if (updateAttachmentsErr) {
                return Err(updateAttachmentsErr)
            }

            return Ok()
        })

        if (!txErr) {
            this._triggerEvent("onMemoChange", {
                memo: {
                    ...memo,
                    content,
                },
            })
        }

        return Ok()
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

    private _triggerEvent(event: "onMemoCreated", data: { memo: Memo }): void
    private _triggerEvent(event: "onMemoChange", data: { memo: Memo }): void
    private _triggerEvent(event: "onMemoChange" | "onMemoCreated", data: { memo: Memo }): void {
        this._events[event].forEach((cb) => {
            queueTask(() => cb(data))
        })
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

    createMemo(ctx: Context<{ db?: DBExec }>, memo: CreateMemoRequest): AsyncResult<Memo>

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

    undeleteMemo(ctx: Context<{ db?: DBExec }>, memoID: MemoID): AsyncResult<void>
    listTags(ctx: Context<{ db?: DBExec }>, query: ListTagsQuery): AsyncResult<TagList>
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
