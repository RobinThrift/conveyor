import type {
    ChangelogEntry,
    ChangelogEntryID,
    ChangelogEntryList,
} from "@/domain/Changelog"
import type { Context } from "@/lib/context"
import type { DBExec } from "@/lib/database"
import { type AsyncResult, fromPromise, mapResult } from "@/lib/result"

import * as queries from "./gen/changelog_sql"

export class ChangelogRepo {
    private _db: DBExec

    constructor(db: DBExec) {
        this._db = db
    }

    public async createChangelogEntry(
        ctx: Context<{ db: DBExec }>,
        entry: ChangelogEntry,
    ): AsyncResult<void> {
        return fromPromise(
            queries.createChangelogEntry(
                ctx.getData("db", this._db),
                {
                    publicId: entry.id,
                    source: entry.source,
                    revision: entry.revision,
                    value: JSON.stringify(entry.value),
                    targetType: entry.targetType,
                    targetId: entry.targetID,
                    isSynced: entry.isSynced,
                    syncedAt: entry.syncedAt,
                    isApplied: entry.isApplied,
                    appliedAt: entry.appliedAt,
                },
                ctx.signal,
            ),
        )
    }

    public async listUnsyncedChangelogEntries(
        ctx: Context<{ db: DBExec }>,
        {
            pagination,
        }: {
            pagination: {
                pageSize: number
                after?: number
            }
        },
    ): AsyncResult<ChangelogEntryList> {
        return mapResult(
            fromPromise(
                queries.listUnsyncedChanges(
                    ctx.getData("db", this._db),
                    {
                        pageSize: pagination.pageSize,
                        chlgPageAfter: pagination.after,
                    },
                    ctx.signal,
                ),
            ),
            (rows) => ({
                items: rows.map((row) => changelogEntryRowChangelogEntry(row)),
                next: rows.at(-1)?.id,
            }),
        )
    }

    public async listUnappliedChangelogEntries(
        ctx: Context<{ db: DBExec }>,
        {
            pagination,
        }: {
            pagination: {
                pageSize: number
                after?: number
            }
        },
    ): AsyncResult<ChangelogEntryList> {
        return mapResult(
            fromPromise(
                queries.listUnappliedChanges(
                    ctx.getData("db", this._db),
                    {
                        pageSize: pagination.pageSize,
                        chlgPageAfter: pagination.after,
                    },
                    ctx.signal,
                ),
            ),
            (rows) => ({
                items: rows.map((row) => changelogEntryRowChangelogEntry(row)),
                next: rows.at(-1)?.id,
            }),
        )
    }

    public async markChangelogEntriesAsSynced(
        ctx: Context<{ db: DBExec }>,
        entries: ChangelogEntryID[],
    ): AsyncResult<void> {
        return fromPromise(
            queries.markChangelogEntriesAsSynced(
                ctx.getData("db", this._db),
                { publicIds: entries },
                ctx.signal,
            ),
        )
    }

    public async markChangelogEntriesAsApplied(
        ctx: Context<{ db: DBExec }>,
        entries: ChangelogEntryID[],
    ): AsyncResult<void> {
        return fromPromise(
            queries.markChangelogEntriesAsApplied(
                ctx.getData("db", this._db),
                { publicIds: entries },
                ctx.signal,
            ),
        )
    }
}

function changelogEntryRowChangelogEntry(
    row: queries.ListUnsyncedChangesRow,
): ChangelogEntry {
    let value = JSON.parse(row.value)

    if (row.targetType === "memos" && "created" in value) {
        value.created.createdAt = new Date(value.created.createdAt)
        value.created.updatedAt = new Date(value.created.updatedAt)
    }

    return {
        id: row.publicId,
        source: row.source,
        revision: row.revision,
        targetType: row.targetType,
        targetID: row.targetId,
        value,
        isSynced: row.isSynced,
        syncedAt: row.syncedAt,
        isApplied: row.isApplied,
        appliedAt: row.appliedAt,
        timestamp: row.createdAt,
    }
}
