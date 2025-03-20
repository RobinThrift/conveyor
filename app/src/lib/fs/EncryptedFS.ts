import type { Context } from "@/lib/context"
import type { Decrypter, Encrypter } from "@/lib/crypto"
import type { AsyncResult } from "@/lib/result"

import type { FS } from "./index"

export class EncryptedFS implements FS {
    private _wrapped: FS
    private _crypto: Encrypter & Decrypter

    constructor(wrapped: FS, crypto: Encrypter & Decrypter) {
        this._wrapped = wrapped
        this._crypto = crypto
    }

    public async read(
        ctx: Context,
        filepath: string,
    ): AsyncResult<ArrayBufferLike> {
        let raw = await this._wrapped.read(ctx, filepath)
        if (!raw.ok) {
            return raw
        }

        return this._crypto.decryptData(new Uint8Array(raw.value))
    }

    public async write(
        ctx: Context,
        filepath: string,
        content: ArrayBufferLike,
    ): AsyncResult<number> {
        let encrypted = await this._crypto.encryptData(new Uint8Array(content))
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
}
