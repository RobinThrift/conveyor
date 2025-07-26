import type { Context } from "@/lib/context"
import type { KVStore } from "@/lib/KVStore"
import { type AsyncResult, Err, Ok } from "@/lib/result"

export class TestInMemKVStore<
    Items extends Record<string, unknown>,
    NotFoundError extends Error = never,
> implements KVStore<Items>
{
    private _values = new Map<keyof Items, Items[keyof Items]>()
    private NotFoundErr?: NotFoundError extends Error ? { new (key: string): NotFoundError } : never

    constructor({
        NotFoundErr,
    }: {
        NotFoundErr?: NotFoundError extends Error ? { new (key: string): NotFoundError } : never
    } = {}) {
        this.NotFoundErr = NotFoundErr
    }

    public async getItem<K extends keyof Items>(
        _ctx: Context,
        key: K,
    ): AsyncResult<Items[K] | undefined> {
        let item = this._values.get(key)
        if (!item && typeof this.NotFoundErr === "function") {
            return Err(new this.NotFoundErr(key as string))
        }
        return Ok(item as Items[K] | undefined)
    }

    public async setItem<K extends keyof Items>(
        _ctx: Context,
        key: K,
        value: Items[K],
    ): AsyncResult<void> {
        this._values.set(key, value)
        return Ok(undefined)
    }

    public async removeItem<K extends keyof Items>(_ctx: Context, key: K): AsyncResult<void> {
        this._values.delete(key)
        return Ok(undefined)
    }

    public async clear(_ctx: Context): AsyncResult<void> {
        this._values.clear()
        return Ok(undefined)
    }
}
