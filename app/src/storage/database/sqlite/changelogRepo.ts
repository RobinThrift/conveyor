import type { ChangelogEntry, ChangelogEntryList } from "@/domain/Changelog"
import type { Context } from "@/lib/context"
import type { DBExec } from "@/lib/database"
import { type AsyncResult, fromPromise, mapResult } from "@/lib/result"

import * as queries from "./gen/changelog_sql"

export async function createChangelogEntry(
    ctx: Context<{ db: DBExec }>,
    entry: ChangelogEntry,
): AsyncResult<void> {
    return fromPromise(
        queries.createChangelogEntry(
            ctx.data.db,
            {
                ...entry,
                targetId: entry.targetID,
                value: JSON.stringify(entry.value),
            },
            ctx.signal,
        ),
    )
}

export async function listUnsyncedChangelogEntries(
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
                ctx.data.db,
                {
                    pageSize: pagination.pageSize,
                    chlgPageAfter: pagination.after,
                },
                ctx.signal,
            ),
        ),
        (rows) => ({
            items: rows.map(
                (row) =>
                    ({
                        source: row.source,
                        revision: row.revision,
                        targetType: row.targetType,
                        targetID: row.targetId,
                        value: JSON.parse(row.value),
                        synced: row.synced,
                        applied: row.applied,
                    }) as ChangelogEntry,
            ),
            next: rows.at(-1)?.id,
        }),
    )
}

export async function listUnappliedChangelogEntries(
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
                ctx.data.db,
                {
                    pageSize: pagination.pageSize,
                    chlgPageAfter: pagination.after,
                },
                ctx.signal,
            ),
        ),
        (rows) => ({
            items: rows.map(
                (row) =>
                    ({
                        revision: row.revision,
                        targetType: row.targetType,
                        targetID: row.targetId,
                        value: JSON.parse(row.value),
                        synced: row.synced,
                        applied: row.applied,
                    }) as ChangelogEntry,
            ),
            next: rows.at(-1)?.id,
        }),
    )
}
