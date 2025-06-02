import type { Context } from "@/lib/context"
import { type AsyncResult, Err, Ok } from "@/lib/result"

import type { KVStore } from "./KVStore"

export class SingleItemKVStore<Key extends string, Value>
    implements KVStore<Record<Key, Value>>
{
    private _key: Key
    private _kv: KVStore<Record<Key, Value>>

    constructor(key: Key, kv: KVStore<Record<Key, Value>>) {
        this._key = key
        this._kv = kv
    }

    public async getItem<K extends Key>(
        ctx: Context,
        _key: K,
    ): AsyncResult<Value | undefined> {
        let [item, err] = await this._kv.getItem(ctx, this._key)
        if (err) {
            return Err(err)
        }

        return Ok(item)
    }

    public async setItem<K extends Key>(
        ctx: Context,
        _key: K,
        value: Value,
    ): AsyncResult<void> {
        return this._kv.setItem(ctx, this._key, value)
    }

    public async removeItem<K extends Key>(
        ctx: Context,
        _key: K,
    ): AsyncResult<void> {
        return this._kv.removeItem(ctx, this._key)
    }

    public async clear(ctx: Context): AsyncResult<void> {
        return this._kv.removeItem(ctx, this._key)
    }
}
