import type { Context } from "@/lib/context"
import type { PlaintextPrivateKey } from "@/lib/crypto"
import type { Database } from "@/lib/database"
import { type FS, FSNotFoundError } from "@/lib/fs"
import { type AsyncResult, Ok, fromPromise, wrapErr } from "@/lib/result"

import { isErr } from "@/lib/errors"
import type { Job } from "./types"

export class ExportJob implements Job {
    public name = "ExportJob"

    private _db: Database
    private _filename: string
    private _privateKey: PlaintextPrivateKey
    private _fs: FS

    constructor({
        db,
        fs,
        filename,
        privateKey,
    }: {
        db: Database
        fs: FS
        filename: string
        privateKey: PlaintextPrivateKey
    }) {
        this._db = db
        this._fs = fs
        this._filename = filename
        this._privateKey = privateKey
    }

    public async run(ctx: Context): AsyncResult<void> {
        let [_rm, rmErr] = await this._fs.remove(ctx, this._filename)
        if (rmErr && !isErr(rmErr, FSNotFoundError)) {
            return wrapErr`[ExportJob]: error removing old file: ${rmErr}`
        }

        let [userVersion, userVersionErr] = await fromPromise(
            this._db.queryOne<{ user_version: number }>(
                "PRAGMA user_version",
                undefined,
                ctx.signal,
            ),
        )
        if (userVersionErr) {
            return wrapErr`[ExportJob]: error getting database user_version: ${userVersionErr}`
        }

        let [_attach, attachErr] = await fromPromise(
            this._db.exec(
                `ATTACH DATABASE '${this._filename}' AS export KEY '${this._privateKey}'`,
                undefined,
                ctx.signal,
            ),
        )
        if (attachErr) {
            return wrapErr`[ExportJob]: error attaching export export database: ${attachErr}`
        }

        let [_export, exportErr] = await fromPromise(
            this._db.exec("SELECT sqlcipher_export('export')", undefined, ctx.signal),
        )
        if (exportErr) {
            return wrapErr`[ExportJob]: error exporting database: ${exportErr}`
        }

        let [_setUserVersion, setUserVersionErr] = await fromPromise(
            this._db.exec(`PRAGMA export.user_version = ${userVersion};`, undefined, ctx.signal),
        )
        if (setUserVersionErr) {
            return wrapErr`[ExportJob]: error setting user_version on exported database: ${setUserVersionErr}`
        }

        let [_detach, detachErr] = await fromPromise(
            this._db.exec(`DETACH DATABASE 'export'`, undefined, ctx.signal),
        )
        if (detachErr) {
            return wrapErr`[ExportJob]: error detaching exported database: ${detachErr}`
        }

        return Ok()
    }
}
