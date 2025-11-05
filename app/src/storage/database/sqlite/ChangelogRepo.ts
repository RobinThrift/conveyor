import type { Temporal } from "temporal-polyfill"

import type {
    ChangelogEntry,
    ChangelogEntryID,
    ChangelogEntryList,
    ChangelogTargetType,
} from "@/domain/Changelog"
import type { Context } from "@/lib/context"
import type { DBExec } from "@/lib/database"
import { parseJSONDate } from "@/lib/json"
import { type AsyncResult, fromPromise, Ok, wrapErr } from "@/lib/result"
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
                after?: [number, Temporal.ZonedDateTime]
            }
        },
    ): AsyncResult<ChangelogEntryList> {
        let [rows, err] = await fromPromise(
            queries.listUnsyncedChanges(
                ctx.getData("db", this._db),
                {
                    pageSize: pagination.pageSize,
                    chlgPageAfterDate: pagination.after ? pagination.after[1] : undefined,
                    chlgPageAfterId: pagination.after ? pagination.after[0] : null,
                },
                ctx.signal,
            ),
        )

        if (err) {
            return wrapErr`error listing unsynced changelog entries: ${err}`
        }

        let last = rows.at(-1)
        return Ok({
            items: rows.map((row) => changelogEntryRowChangelogEntry(row)),
            next: last ? [last.id, last.timestamp] : undefined,
        })
    }

    public async listUnappliedChangelogEntries(
        ctx: Context<{ db: DBExec }>,
        {
            pagination,
        }: {
            pagination: {
                pageSize: number
                after?: [number, Temporal.ZonedDateTime]
            }
        },
    ): AsyncResult<ChangelogEntryList> {
        let [rows, err] = await fromPromise(
            queries.listUnappliedChanges(
                ctx.getData("db", this._db),
                {
                    pageSize: pagination.pageSize,
                    chlgPageAfterDate: pagination.after ? pagination.after[1] : undefined,
                    chlgPageAfterId: pagination.after ? pagination.after[0] : null,
                },
                ctx.signal,
            ),
        )

        if (err) {
            return wrapErr`error listing unappleid chanelog entries: ${err}`
        }

        let last = rows.at(-1)
        return Ok({
            items: rows.map((row) => changelogEntryRowChangelogEntry(row)),
            next: last ? [last.id, last.timestamp] : undefined,
        })
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
        let [rows, err] = await fromPromise(
            queries.listChangelogEntriesForID(
                ctx.getData("db", this._db),
                { targetId: targetID },
                ctx.signal,
            ),
        )

        if (err) {
            return wrapErr`error listing changelog entries for ID: ${targetID}: ${err}`
        }

        return Ok(rows.map((row) => changelogEntryRowChangelogEntry(row) as C))
    }

    public async deleteChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        id: ChangelogEntryID,
    ): AsyncResult<void> {
        return fromPromise(
            queries.deleteChangelogEntry(ctx.getData("db", this._db), { publicId: id }, ctx.signal),
        )
    }
}

function changelogEntryRowChangelogEntry(row: queries.ListUnsyncedChangesRow): ChangelogEntry {
    let value = JSON.parse(row.value)

    if (row.targetType === "memos" && "created" in value) {
        let [createdAt] = parseJSONDate(value.created.createdAt)
        value.created.createdAt = createdAt
        let [updatedAt] = parseJSONDate(value.created.updatedAt)
        value.created.updatedAt = updatedAt
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
