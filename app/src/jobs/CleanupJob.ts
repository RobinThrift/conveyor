import type { ChangelogController } from "@/control/ChangelogController"
import type { MemoController } from "@/control/MemoController"
import type { MemoChangelogEntry } from "@/domain/Changelog"
import { ErrMemoNotFound } from "@/domain/Memo"
import type { Context } from "@/lib/context"
import { isErr } from "@/lib/errors"
import { type AsyncResult, Err, Ok, all, wrapErr } from "@/lib/result"

import type { Job } from "./types"

export class CleanupJob implements Job {
    private _changelogCtrl: ChangelogController
    private _memoCtrl: MemoController

    constructor({
        changelogCtrl,
        memoCtrl,
    }: {
        changelogCtrl: ChangelogController
        memoCtrl: MemoController
    }) {
        this._changelogCtrl = changelogCtrl
        this._memoCtrl = memoCtrl
    }

    public async run(ctx: Context): AsyncResult<void> {
        let [_, err] = await this._removeOrphanedChangelogEntries(ctx)
        if (err) {
            return wrapErr`[CleanupJob]: ${err}`
        }

        return Ok()
    }

    private async _removeOrphanedChangelogEntries(ctx: Context): AsyncResult<void> {
        for await (let [page, pageErr] of this._listUnsyncedChangelogEntries(ctx)) {
            if (pageErr) {
                return Err(pageErr)
            }

            let [_, err] = await all(
                page.items
                    .values()
                    .filter((e) => e.targetType === "memos")
                    .map((e) => this._checkMemoChangelogEntry(ctx, e as MemoChangelogEntry)),
            )
            if (err) {
                return Err(err)
            }
        }

        return Ok()
    }

    private async _checkMemoChangelogEntry(
        ctx: Context,
        entry: MemoChangelogEntry,
    ): AsyncResult<void> {
        let [memo, getMemoErr] = await this._memoCtrl.getMemo(ctx, entry.targetID)
        if (memo) {
            return Ok()
        }

        if (isErr(getMemoErr, ErrMemoNotFound)) {
            let [_, deleteErr] = await this._changelogCtrl.deleteChangelogEntry(ctx, entry.id)
            if (deleteErr) {
                return wrapErr`error deleting changelog entry: ${deleteErr}`
            }
        }

        return Ok()
    }

    private async *_listUnsyncedChangelogEntries(ctx: Context) {
        let after: [number, Date] | undefined

        while (true) {
            let [page, pageErr] = await this._changelogCtrl.listUnsyncedChangelogEntries(ctx, {
                pagination: {
                    pageSize: 50,
                    after,
                },
            })
            if (pageErr) {
                return wrapErr`error getting unsynced changelog entries: ${pageErr}`
            }

            if (!page.next) {
                return Ok(page)
            }

            after = page.next

            yield Ok(page)
        }
    }
}
