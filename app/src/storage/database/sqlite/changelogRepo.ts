import type {
    ChangelogEntry,
    ChangelogEntryID,
    ChangelogEntryList,
    ChangelogTargetType,
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
                    timestamp: entry.timestamp,
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

    public async listChangelogEntriesForID<C extends ChangelogEntry>(
        ctx: Context<{ db: DBExec }>,
        targetID: string,
    ): AsyncResult<C[]> {
        return mapResult(
            fromPromise(
                queries.listChangelogEntriesForID(
                    ctx.getData("db", this._db),
                    { targetId: targetID },
                    ctx.signal,
                ),
            ),
            (rows) =>
                rows.map((row) => changelogEntryRowChangelogEntry(row) as C),
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
        targetType: row.targetType as ChangelogTargetType,
        targetID: row.targetId,
        value,
        isSynced: row.isSynced,
        syncedAt: row.syncedAt,
        isApplied: row.isApplied,
        appliedAt: row.appliedAt,
        timestamp: row.timestamp,
    }
}
