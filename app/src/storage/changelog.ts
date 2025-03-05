import type {
    ChangelogEntry,
    ChangelogEntryID,
    ChangelogEntryList,
} from "@/domain/Changelog"
import { newID } from "@/domain/ID"
import type { Context } from "@/lib/context"
import { type DBExec, type Database, withTx } from "@/lib/database"
import { Ok, type AsyncResult } from "@/lib/result"

export class ChangelogStorage {
    private _sourceName: string
    private _db: Database
    private _repo: ChangelogRepo

    constructor({
        sourceName,
        db,
        repo,
    }: { sourceName: string; db: Database; repo: ChangelogRepo }) {
        this._sourceName = sourceName
        this._db = db
        this._repo = repo
    }

    public async createChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        entry: Omit<ChangelogEntry, "source" | "id">,
    ): AsyncResult<void> {
        return withTx(ctx, this._db, (ctx) =>
            this._repo.createChangelogEntry(ctx, {
                ...entry,
                id: newID(),
                source: this._sourceName,
                timestamp: new Date(),
            }),
        )
    }

    public async insertExternalChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        entries: ChangelogEntry[],
    ): AsyncResult<void> {
        return withTx(ctx, this._db, async (ctx) => {
            for (let entry of entries) {
                let res = await this._repo.createChangelogEntry(ctx, entry)
                if (!res.ok) {
                    return res
                }
            }

            return Ok(undefined)
        })
    }

    public async listUnsyncedChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        args: {
            pagination: {
                pageSize: number
                after?: number
            }
        },
    ): AsyncResult<ChangelogEntryList> {
        return withTx(ctx, this._db, (ctx) =>
            this._repo.listUnsyncedChangelogEntries(ctx, args),
        )
    }

    public async listUnapplidChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        args: {
            pagination: {
                pageSize: number
                after?: number
            }
        },
    ): AsyncResult<ChangelogEntryList> {
        return withTx(ctx, this._db, (ctx) =>
            this._repo.listUnappliedChangelogEntries(ctx, args),
        )
    }

    public async markChangelogEntriesAsSynced(
        ctx: Context<{ db?: DBExec }>,
        entries: ChangelogEntry[],
    ): AsyncResult<void> {
        return withTx(ctx, this._db, async (ctx) => {
            return this._repo.markChangelogEntriesAsSynced(
                ctx,
                entries.map((e) => e.id),
            )
        })
    }

    public async markChangelogEntriesAsApplied(
        ctx: Context<{ db?: DBExec }>,
        entries: ChangelogEntry[],
    ): AsyncResult<void> {
        return withTx(ctx, this._db, async (ctx) => {
            return this._repo.markChangelogEntriesAsApplied(
                ctx,
                entries.map((e) => e.id),
            )
        })
    }
}

export interface ChangelogRepo {
    createChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        entry: ChangelogEntry,
    ): AsyncResult<void>

    listUnsyncedChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        args: {
            pagination: {
                pageSize: number
                after?: number
            }
        },
    ): AsyncResult<ChangelogEntryList>

    listUnappliedChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        args: {
            pagination: {
                pageSize: number
                after?: number
            }
        },
    ): AsyncResult<ChangelogEntryList>

    markChangelogEntriesAsSynced(
        ctx: Context<{ db: DBExec }>,
        entries: ChangelogEntryID[],
    ): AsyncResult<void>

    markChangelogEntriesAsApplied(
        ctx: Context<{ db: DBExec }>,
        entries: ChangelogEntryID[],
    ): AsyncResult<void>
}
