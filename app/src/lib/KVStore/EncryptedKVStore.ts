import type { Context } from "@/lib/context"
import type { Decrypter, Encrypter } from "@/lib/crypto"
import { jsonDeserialize } from "@/lib/json"
import { type AsyncResult, Ok, type Result } from "@/lib/result"
import { encodeText } from "@/lib/textencoding"

import type { KVStore } from "./KVStore"

export class EncryptedKVStore<Items extends Record<string, unknown>>
    implements KVStore<Items>
{
    private _kv: KVStore<Record<keyof Items, ArrayBufferLike>>
    private _crypto: Encrypter & Decrypter
    private _serialize: <K extends keyof Items>(
        d: Items[K],
    ) => Uint8Array<ArrayBufferLike>
    private _deserialize: <K extends keyof Items>(
        raw: Uint8Array<ArrayBufferLike>,
    ) => Result<Items[K]>

    constructor({
        kv,
        crypto,
        serialize,
        deseerialize = jsonDeserialize,
    }: {
        kv: KVStore<Record<keyof Items, ArrayBufferLike>>
        crypto: Encrypter & Decrypter
        serialize?: <K extends keyof Items>(
            d: Items[K],
        ) => Uint8Array<ArrayBufferLike>
        deseerialize?: <K extends keyof Items>(
            raw: Uint8Array<ArrayBufferLike>,
        ) => Result<Items[K]>
    }) {
        this._kv = kv
        this._crypto = crypto
        this._serialize =
            serialize ?? ((d: any) => encodeText(JSON.stringify(d)))
        this._deserialize = deseerialize
    }

    public async getItem<K extends keyof Items>(
        ctx: Context,
        key: K,
    ): AsyncResult<Items[K] | undefined> {
        let item = await this._kv.getItem(ctx, key)
        if (!item.ok) {
            return item
        }
        if (!item.value) {
            return Ok(undefined)
        }

        let decrypted = await this._crypto.decryptData(
            new Uint8Array(item.value),
        )
        if (!decrypted.ok) {
            return decrypted
        }

        return this._deserialize(new Uint8Array(decrypted.value))
    }

    public async setItem<K extends keyof Items>(
        ctx: Context,
        key: K,
        value: Items[K],
    ): AsyncResult<void> {
        let encrypted = await this._crypto.encryptData(this._serialize(value))
        if (!encrypted.ok) {
            return encrypted
        }
        return this._kv.setItem(ctx, key, encrypted.value)
    }

    public async removeItem<K extends keyof Items>(
        ctx: Context,
        key: K,
    ): AsyncResult<void> {
        return this._kv.removeItem(ctx, key)
    }

    public async clear(ctx: Context): AsyncResult<void> {
        return this._kv.clear(ctx)
    }
}
