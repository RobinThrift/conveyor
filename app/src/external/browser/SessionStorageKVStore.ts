import type { KVStore, KVStoreContainer } from "@/lib/KVStore"
import type { Context } from "@/lib/context"
import { jsonDeserialize } from "@/lib/json"
import { type AsyncResult, Err, Ok, type Result } from "@/lib/result"

export class SessionStorageKVStoreContainer<Names extends string>
    implements KVStoreContainer<Names>
{
    public getKVStore<
        Items extends Record<string, unknown>,
        NotFoundError extends Error = never,
    >(
        name: Names,
        opts: {
            serialize?: <K extends keyof Items>(d: Items[K]) => string
            deserialize?: <K extends keyof Items>(
                raw: string,
            ) => Result<Items[K]>
            NotFoundErr?: NotFoundError extends Error
                ? { new (key: keyof Items): NotFoundError }
                : never
        } = {},
    ): SessionStorageKVStore<Items, NotFoundError> {
        return new SessionStorageKVStore(name, opts)
    }
}

export class SessionStorageKVStore<
    Items extends Record<string, unknown>,
    NotFoundError extends Error = never,
> implements KVStore<Items>
{
    private _prefix: string
    private _serialize: <K extends keyof Items>(d: Items[K]) => string
    private _deserialize: <K extends keyof Items>(
        raw: string,
    ) => Result<Items[K]>
    private NotFoundErr?: NotFoundError extends Error
        ? { new (key: keyof Items): NotFoundError }
        : never

    constructor(
        prefix: string,
        {
            serialize,
            deserialize = jsonDeserialize,
            NotFoundErr,
        }: {
            serialize?: <K extends keyof Items>(d: Items[K]) => string
            deserialize?: <K extends keyof Items>(
                raw: string,
            ) => Result<Items[K]>
            NotFoundErr?: NotFoundError extends Error
                ? { new (key: keyof Items): NotFoundError }
                : never
        },
    ) {
        this._prefix = `conveyor:${prefix}`
        this._serialize = serialize ?? ((d: any) => JSON.stringify(d))
        this._deserialize = deserialize
        this.NotFoundErr = NotFoundErr
    }

    public async getItem<K extends keyof Items>(
        _ctx: Context,
        key: K,
    ): AsyncResult<Items[K] | undefined> {
        let item = globalThis.sessionStorage.getItem(
            `${this._prefix}:${key as string}`,
        )
        if (!item && typeof this.NotFoundErr === "function") {
            return Err(new this.NotFoundErr(key))
        }
        if (!item) {
            return Ok(undefined)
        }

        return this._deserialize(item)
    }

    public async setItem<K extends keyof Items>(
        _ctx: Context,
        key: K,
        value: Items[K],
    ): AsyncResult<void> {
        globalThis.sessionStorage.setItem(
            `${this._prefix}:${key as string}`,
            this._serialize(value),
        )
        return Ok(undefined)
    }

    public async removeItem<K extends keyof Items>(
        _ctx: Context,
        key: K,
    ): AsyncResult<void> {
        globalThis.sessionStorage.removeItem(`${this._prefix}:${key as string}`)
        return Ok(undefined)
    }

    public async clear(_ctx: Context): AsyncResult<void> {
        for (let i = 0; i < globalThis.sessionStorage.length; i++) {
            let key = globalThis.sessionStorage.key(i)
            if (key?.startsWith(this._prefix)) {
                globalThis.sessionStorage.removeItem(`${this._prefix}:${key}`)
            }
        }
        return Ok(undefined)
    }
}
