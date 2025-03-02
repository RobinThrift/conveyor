import type { ChangelogEntry, ChangelogEntryList } from "@/domain/Changelog"
import type { Context } from "@/lib/context"
import { type DBExec, type Database, withTx } from "@/lib/database"
import type { AsyncResult } from "@/lib/result"

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
        entry: Omit<ChangelogEntry, "source">,
    ): AsyncResult<void> {
        return withTx(ctx, this._db, (ctx) =>
            this._repo.createChangelogEntry(ctx, {
                ...entry,
                source: this._sourceName,
            }),
        )
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
}
