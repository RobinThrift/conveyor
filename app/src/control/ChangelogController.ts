import type {
    ChangelogEntry,
    ChangelogEntryID,
    ChangelogEntryList,
} from "@/domain/Changelog"
import { newID } from "@/domain/ID"
import type { Context } from "@/lib/context"
import type { DBExec, Transactioner } from "@/lib/database"
import { type AsyncResult, Err, Ok } from "@/lib/result"

export class ChangelogController {
    private _sourceName: string
    private _transactioner: Transactioner
    private _repo: Repo

    constructor({
        sourceName,
        transactioner,
        repo,
    }: {
        sourceName: string
        transactioner: Transactioner
        repo: Repo
    }) {
        this._sourceName = sourceName
        this._transactioner = transactioner
        this._repo = repo
    }

    public async createChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        entry: Omit<ChangelogEntry, "source" | "id">,
    ): AsyncResult<void> {
        return this._transactioner.inTransaction(ctx, async (ctx) =>
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
        return this._transactioner.inTransaction(ctx, async (ctx) => {
            for (let entry of entries) {
                let [_, err] = await this._repo.createChangelogEntry(ctx, entry)
                if (err) {
                    return Err(err)
                }
            }

            return Ok()
        })
    }

    public async listUnsyncedChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        args: {
            pagination: {
                pageSize: number
                after?: [number, Date]
            }
        },
    ): AsyncResult<ChangelogEntryList> {
        return this._transactioner.inTransaction(ctx, async (ctx) =>
            this._repo.listUnsyncedChangelogEntries(ctx, args),
        )
    }

    public async listUnapplidChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        args: {
            pagination: {
                pageSize: number
                after?: [number, Date]
            }
        },
    ): AsyncResult<ChangelogEntryList> {
        return this._transactioner.inTransaction(ctx, async (ctx) =>
            this._repo.listUnappliedChangelogEntries(ctx, args),
        )
    }

    public async markChangelogEntriesAsSynced(
        ctx: Context<{ db?: DBExec }>,
        entries: ChangelogEntry[],
    ): AsyncResult<void> {
        return this._transactioner.inTransaction(ctx, async (ctx) =>
            this._repo.markChangelogEntriesAsSynced(
                ctx,
                entries.map((e) => e.id),
            ),
        )
    }

    public async markChangelogEntriesAsApplied(
        ctx: Context<{ db?: DBExec }>,
        entryIDs: ChangelogEntryID[],
    ): AsyncResult<void> {
        return this._transactioner.inTransaction(ctx, async (ctx) =>
            this._repo.markChangelogEntriesAsApplied(ctx, entryIDs),
        )
    }

    public async listChangelogEntriesForID<C extends ChangelogEntry>(
        ctx: Context<{ db?: DBExec }>,
        targetID: string,
    ): AsyncResult<C[]> {
        return this._repo.listChangelogEntriesForID(ctx, targetID)
    }

    public async deleteChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        id: ChangelogEntryID,
    ): AsyncResult<void> {
        return this._repo.deleteChangelogEntry(ctx, id)
    }
}

interface Repo {
    createChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        entry: ChangelogEntry,
    ): AsyncResult<void>

    listUnsyncedChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        args: {
            pagination: {
                pageSize: number
                after?: [number, Date]
            }
        },
    ): AsyncResult<ChangelogEntryList>

    listUnappliedChangelogEntries(
        ctx: Context<{ db?: DBExec }>,
        args: {
            pagination: {
                pageSize: number
                after?: [number, Date]
            }
        },
    ): AsyncResult<ChangelogEntryList>

    listChangelogEntriesForID<C extends ChangelogEntry>(
        ctx: Context<{ db?: DBExec }>,
        targetID: string,
    ): AsyncResult<C[]>

    markChangelogEntriesAsSynced(
        ctx: Context<{ db: DBExec }>,
        entries: ChangelogEntryID[],
    ): AsyncResult<void>

    markChangelogEntriesAsApplied(
        ctx: Context<{ db: DBExec }>,
        entries: ChangelogEntryID[],
    ): AsyncResult<void>

    deleteChangelogEntry(
        ctx: Context<{ db?: DBExec }>,
        id: ChangelogEntryID,
    ): AsyncResult<void>
}
