import { LazyStore } from "@tauri-apps/plugin-store"
import type { Context } from "@/lib/context"
import type { KVStore, KVStoreContainer } from "@/lib/KVStore"
import { type AsyncResult, Err, fromPromise, Ok, type Result, wrapErr } from "@/lib/result"

export class TauriKVStoreContainer<Names extends string> implements KVStoreContainer<Names> {
    private _stores: LazyStore[] = []

    public getKVStore<Items extends Record<string, unknown>, NotFoundError extends Error = never>(
        name: Names,
        opts: {
            instantiate?: <K extends keyof Items>(
                raw: Record<string, unknown> | ArrayBufferLike,
            ) => Result<Items[K]>
            NotFoundErr?: NotFoundError extends Error
                ? { new (key: keyof Items): NotFoundError }
                : never
        } = {},
    ): TauriKVStore<Items, NotFoundError> {
        let store = new LazyStore(`${name}.json`, { autoSave: true })
        this._stores.push(store)
        return new TauriKVStore(store, opts)
    }

    public async close() {
        return Promise.all(this._stores.map((store) => store.close()))
    }
}

export class TauriKVStore<
    Items extends Record<string, unknown>,
    NotFoundError extends Error = never,
> implements KVStore<Items>
{
    private _store: LazyStore
    private _instantiate: <K extends keyof Items>(
        raw: Record<string, unknown> | ArrayBufferLike,
    ) => Result<Items[K]>
    private NotFoundErr?: NotFoundError extends Error
        ? { new (key: keyof Items): NotFoundError }
        : never

    constructor(
        store: LazyStore,
        {
            instantiate,
            NotFoundErr,
        }: {
            instantiate?: <K extends keyof Items>(
                raw: Record<string, unknown> | ArrayBufferLike,
            ) => Result<Items[K]>
            NotFoundErr?: NotFoundError extends Error
                ? { new (key: keyof Items): NotFoundError }
                : never
        },
    ) {
        this._store = store
        this._instantiate = instantiate ?? ((raw: any) => Ok(raw))
        this.NotFoundErr = NotFoundErr
    }

    public async getItem<K extends keyof Items>(
        _ctx: Context,
        key: K,
    ): AsyncResult<Items[K] | undefined> {
        let [item, err] = await fromPromise(this._store.get(key as string))
        if (err) {
            return wrapErr`error getting item: ${key}: ${err}`
        }

        if (!item && typeof this.NotFoundErr === "function") {
            return Err(new this.NotFoundErr(key))
        }
        if (!item) {
            return Ok(undefined)
        }

        return this._instantiate(item as any)
    }

    public async setItem<K extends keyof Items>(
        _ctx: Context,
        key: K,
        value: Items[K],
    ): AsyncResult<void> {
        return fromPromise(this._store.set(key as string, value))
    }

    public async removeItem<K extends keyof Items>(_ctx: Context, key: K): AsyncResult<void> {
        let [_, err] = await fromPromise(this._store.delete(key as string))
        if (err) {
            return wrapErr`error removing item: ${key}: ${err}`
        }
        return Ok(undefined)
    }

    public async clear(_ctx: Context): AsyncResult<void> {
        return fromPromise(this._store.clear())
    }
}
