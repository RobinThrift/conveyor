import {
    BaseDirectory,
    mkdir,
    readFile,
    remove,
    writeFile,
} from "@tauri-apps/plugin-fs"

import type { Context } from "@/lib/context"
import { type FS, join } from "@/lib/fs"
import { type AsyncResult, Ok, fromPromise } from "@/lib/result"

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
        let ready = await this._ready
        if (!ready.ok) {
            return ready
        }

        let data = await fromPromise(
            readFile(join(this._baseDir, filepath), {
                baseDir: BaseDirectory.AppLocalData,
            }),
        )
        if (!data.ok) {
            return data
        }

        return Ok(data.value.buffer)
    }

    public async write(
        _ctx: Context,
        filepath: string,
        content: ArrayBufferLike,
    ): AsyncResult<number> {
        let ready = await this._ready
        if (!ready.ok) {
            return ready
        }

        let res = await fromPromise(
            writeFile(join(this._baseDir, filepath), new Uint8Array(content), {
                baseDir: BaseDirectory.AppLocalData,
            }),
        )
        if (!res.ok) {
            return res
        }

        return Ok(content.byteLength)
    }

    public async remove(_ctx: Context, filepath: string): AsyncResult<void> {
        let ready = await this._ready
        if (!ready.ok) {
            return ready
        }

        return fromPromise(
            remove(join(this._baseDir, filepath), {
                baseDir: BaseDirectory.AppLocalData,
            }),
        )
    }

    public async mkdirp(_ctx: Context, dirpath: string): AsyncResult<void> {
        let ready = await this._ready
        if (!ready.ok) {
            return ready
        }

        return fromPromise(
            mkdir(join(this._baseDir, dirpath), {
                baseDir: BaseDirectory.AppLocalData,
                recursive: true,
            }),
        )
    }
}
