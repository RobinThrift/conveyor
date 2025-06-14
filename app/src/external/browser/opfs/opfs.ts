import { BaseContext, type Context } from "@/lib/context"
import { type FS, join } from "@/lib/fs"
import { type AsyncResult, Err, Ok } from "@/lib/result"

import { newID } from "@/domain/ID"
import { OPFSWorker } from "./OPFSWorker"

export class OPFS implements FS {
    private _baseDir: string
    private _worker: ReturnType<typeof OPFSWorker.createClient>
    private _ready: AsyncResult<void>

    constructor(
        baseDir: string,
        { onError }: { onError?: (err: Error) => void } = {},
    ) {
        this._baseDir = baseDir
        this._worker = OPFSWorker.createClient(
            new Worker(new URL("./opfs.worker?worker&url", import.meta.url), {
                type: "module",
                name: `OPFSWorker-${newID()}`,
            }),
        )

        if (onError) {
            this._worker.addEventListener("error", (evt) => {
                onError(evt.data.error)
            })
        }

        // this._worker.addEventListener("error", (evt) => {
        //     let [title, message] = evt.data.error.message.split(/:\n/, 2)
        //     eventbus.emit("notifications:add", {
        //         type: "error",
        //         title: `OPFSWorker: ${title}`,
        //         message,
        //     })
        // })

        this._ready = this._worker.mkdirp(BaseContext, { dirpath: baseDir })
    }

    public terminate() {
        this._worker.terminate()
    }

    public async read(
        ctx: Context,
        filepath: string,
    ): AsyncResult<ArrayBufferLike> {
        let [_ready, readyErr] = await this._ready
        if (readyErr) {
            return Err(readyErr)
        }

        return this._worker.read(ctx, {
            filepath: join(this._baseDir, filepath),
        })
    }

    public async write(
        ctx: Context,
        filepath: string,
        content: ArrayBufferLike,
    ): AsyncResult<number> {
        let [_ready, readyErr] = await this._ready
        if (readyErr) {
            return Err(readyErr)
        }

        return this._worker.write(ctx, {
            filepath: join(this._baseDir, filepath),
            content: content,
        })
    }

    public async remove(ctx: Context, filepath: string): AsyncResult<void> {
        let [_ready, readyErr] = await this._ready
        if (readyErr) {
            return Err(readyErr)
        }

        return this._worker.remove(ctx, {
            filepath: join(this._baseDir, filepath),
        })
    }

    public async mkdirp(ctx: Context, dirpath: string): AsyncResult<void> {
        if (dirpath === ".") {
            return Ok(undefined)
        }

        let [_ready, readyErr] = await this._ready
        if (readyErr) {
            return Err(readyErr)
        }

        return this._worker.mkdirp(ctx, {
            dirpath: join(this._baseDir, dirpath),
        })
    }
}
