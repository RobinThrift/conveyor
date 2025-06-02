import {
    BaseDirectory,
    mkdir,
    readFile,
    remove,
    writeFile,
} from "@tauri-apps/plugin-fs"

import type { Context } from "@/lib/context"
import { type FS, join } from "@/lib/fs"
import { type AsyncResult, Err, Ok, fromPromise, wrapErr } from "@/lib/result"

export class TauriFS implements FS {
    private _baseDir: string
    private _ready: AsyncResult<void>

    constructor(baseDir: string) {
        this._baseDir = baseDir
        this._ready = fromPromise(
            mkdir(baseDir, {
                baseDir: BaseDirectory.AppLocalData,
                recursive: true,
            }),
        )
    }

    public async read(
        _ctx: Context,
        filepath: string,
    ): AsyncResult<ArrayBufferLike> {
        let [_, readyErr] = await this._ready
        if (readyErr) {
            return Err(readyErr)
        }

        let [data, err] = await fromPromise(
            readFile(join(this._baseDir, filepath), {
                baseDir: BaseDirectory.AppLocalData,
            }),
        )
        if (err) {
            return wrapErr`error reading file: ${filepath}: ${err}`
        }

        return Ok(data.buffer)
    }

    public async write(
        _ctx: Context,
        filepath: string,
        content: ArrayBufferLike,
    ): AsyncResult<number> {
        let [_r, readyErr] = await this._ready
        if (readyErr) {
            return Err(readyErr)
        }

        let [_, err] = await fromPromise(
            writeFile(join(this._baseDir, filepath), new Uint8Array(content), {
                baseDir: BaseDirectory.AppLocalData,
            }),
        )
        if (err) {
            return wrapErr`error writing file: ${filepath}: ${err}`
        }

        return Ok(content.byteLength)
    }

    public async remove(_ctx: Context, filepath: string): AsyncResult<void> {
        let [_, readyErr] = await this._ready
        if (readyErr) {
            return Err(readyErr)
        }

        return fromPromise(
            remove(join(this._baseDir, filepath), {
                baseDir: BaseDirectory.AppLocalData,
            }),
        )
    }

    public async mkdirp(_ctx: Context, dirpath: string): AsyncResult<void> {
        let [_, readyErr] = await this._ready
        if (readyErr) {
            return Err(readyErr)
        }

        return fromPromise(
            mkdir(join(this._baseDir, dirpath), {
                baseDir: BaseDirectory.AppLocalData,
                recursive: true,
            }),
        )
    }
}
