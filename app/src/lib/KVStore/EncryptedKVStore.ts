import type { Context } from "@/lib/context"
import type { Decrypter, Encrypter } from "@/lib/crypto"
import { createErrType } from "@/lib/errors"
import { jsonDeserialize } from "@/lib/json"
import { type AsyncResult, Ok, type Result, wrapErr } from "@/lib/result"
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
        deserialize = jsonDeserialize,
    }: {
        kv: KVStore<Record<keyof Items, ArrayBufferLike>>
        crypto: Encrypter & Decrypter
        serialize?: <K extends keyof Items>(
            d: Items[K],
        ) => Uint8Array<ArrayBufferLike>
        deserialize?: <K extends keyof Items>(
            raw: Uint8Array<ArrayBufferLike>,
        ) => Result<Items[K]>
    }) {
        this._kv = kv
        this._crypto = crypto
        this._serialize =
            serialize ?? ((d: any) => encodeText(JSON.stringify(d)))
        this._deserialize = deserialize
    }

    public static ErrGetItem = createErrType(
        "EncryptedKVStore",
        "error getting item",
    )
    public async getItem<K extends keyof Items>(
        ctx: Context,
        key: K,
    ): AsyncResult<Items[K] | undefined> {
        let [item, err] = await this._kv.getItem(ctx, key)
        if (err) {
            return wrapErr`${new EncryptedKVStore.ErrGetItem()}: ${err}`
        }
        if (!item) {
            return Ok(undefined)
        }

        let [decrypted, decryptionErr] = await this._crypto.decryptData(
            new Uint8Array(item),
        )
        if (decryptionErr) {
            return wrapErr`${new EncryptedKVStore.ErrGetItem()}: error decrypting data: ${decryptionErr}`
        }

        let [deserialized, desererlisationErr] = this._deserialize(
            new Uint8Array(decrypted),
        )
        if (desererlisationErr) {
            return wrapErr`${new EncryptedKVStore.ErrGetItem()}: error deserialising data: ${desererlisationErr}`
        }

        return Ok(deserialized as Items[K])
    }

    public static ErrSetItem = createErrType(
        "EncryptedKVStore",
        "error setting item",
    )
    public async setItem<K extends keyof Items>(
        ctx: Context,
        key: K,
        value: Items[K],
    ): AsyncResult<void> {
        let [encrypted, encryptionErr] = await this._crypto.encryptData(
            this._serialize(value),
        )
        if (encryptionErr) {
            return wrapErr`${new EncryptedKVStore.ErrSetItem()}: error encrypting data: ${encryptionErr}`
        }
        let [_, err] = await this._kv.setItem(ctx, key, encrypted)
        if (err) {
            return wrapErr`${new EncryptedKVStore.ErrSetItem()}: ${err}`
        }

        return Ok()
    }

    public static ErrRemoveItem = createErrType(
        "EncryptedKVStore",
        "error removing item",
    )
    public async removeItem<K extends keyof Items>(
        ctx: Context,
        key: K,
    ): AsyncResult<void> {
        let [, err] = await this._kv.removeItem(ctx, key)
        if (err) {
            return wrapErr`${new EncryptedKVStore.ErrRemoveItem()}: ${err}`
        }
        return Ok()
    }

    public static ErrClear = createErrType(
        "EncryptedKVStore",
        "error clearing items",
    )
    public async clear(ctx: Context): AsyncResult<void> {
        let [, err] = await this._kv.clear(ctx)
        if (err) {
            return wrapErr`${new EncryptedKVStore.ErrClear()}: ${err}`
        }
        return Ok()
    }
}
