import type { Context } from "@/lib/context"
import type { CryptoKey } from "@/lib/crypto"
import type { AsyncResult } from "@/lib/result"

import { EncryptedFSWorker } from "./encryptedfs.worker"
import type { FS } from "./index"

export class EncrypedFS implements FS {
    private _wrapped: FS
    private _worker: ReturnType<typeof EncryptedFSWorker.createClient>
    private _enckey: CryptoKey

    constructor(
        wrapped: FS,
        enckey: CryptoKey,
        { onError }: { onError?: (err: Error) => void } = {},
    ) {
        this._wrapped = wrapped
        this._enckey = enckey

        this._worker = EncryptedFSWorker.createClient(
            new Worker(
                new URL("./encryptedfs.worker?worker&url", import.meta.url),
                {
                    type: "module",
                    name: "EncryptedFSWorker",
                },
            ),
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
        //         title: `EncryptedFSWorker: ${title}`,
        //         message,
        //     })
        // })
    }

    public async read(
        ctx: Context,
        filepath: string,
    ): AsyncResult<ArrayBufferLike> {
        let raw = await this._wrapped.read(ctx, filepath)
        if (!raw.ok) {
            return raw
        }

        return this._worker.read(ctx, {
            data: raw.value,
            enckey: this._enckey,
        })
    }

    public async write(
        ctx: Context,
        filepath: string,
        content: ArrayBufferLike,
    ): AsyncResult<number> {
        let encrypted = await this._worker.write(ctx, {
            data: content,
            enckey: this._enckey,
        })
        if (!encrypted.ok) {
            return encrypted
        }

        return this._wrapped.write(ctx, filepath, encrypted.value)
    }

    public remove(ctx: Context, filepath: string): AsyncResult<void> {
        return this._wrapped.remove(ctx, filepath)
    }

    public mkdirp(ctx: Context, dirpath: string): AsyncResult<void> {
        return this._wrapped.mkdirp(ctx, dirpath)
    }

    public terminate() {
        this._worker.terminate()
    }
}
