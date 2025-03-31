import type { KVStore, KVStoreContainer } from "@/lib/KVStore"
import type { Context } from "@/lib/context"
import {
    type AsyncResult,
    Err,
    Ok,
    type Result,
    fromPromise,
    fromThrowing,
} from "@/lib/result"

type KVRow<V> = {
    key: IDBValidKey
    value: V
}

export class IndexDBKVStore<
    Name extends string,
    Items extends Record<string, unknown>,
    NotFoundError extends Error = never,
> implements KVStore<Items>
{
    private _db: IndexedDBKVStoreContainer<Name>
    private _name: Name
    private _instantiate: <K extends keyof Items>(
        raw: Record<string, unknown> | ArrayBufferLike,
    ) => Result<Items[K]>
    private NotFoundErr?: NotFoundError extends Error
        ? { new (key: string): NotFoundError }
        : never

    constructor(
        name: Name,
        db: IndexedDBKVStoreContainer<Name>,
        {
            instantiate,
            NotFoundErr,
        }: {
            instantiate?: <K extends keyof Items>(
                raw: Record<string, unknown> | ArrayBufferLike,
            ) => Result<Items[K]>
            NotFoundErr?: NotFoundError extends Error
                ? { new (key: string): NotFoundError }
                : never
        },
    ) {
        this._name = name
        this._db = db
        this._instantiate = instantiate ?? ((raw: any) => Ok(raw))
        this.NotFoundErr = NotFoundErr
    }

    public async getItem<K extends keyof Items>(
        ctx: Context,
        key: K,
    ): AsyncResult<Items[K] | undefined> {
        let item = await this._db.get<Items[K]>(ctx, this._name, key as string)
        if (!item.ok) {
            return item
        }

        if (!item.value && typeof this.NotFoundErr === "function") {
            return Err(new this.NotFoundErr(key as string))
        }

        if (!item.value) {
            return Ok(item.value)
        }

        return this._instantiate(item.value.value as any)
    }

    public async setItem<K extends keyof Items>(
        ctx: Context,
        key: K,
        value: Items[K],
    ): AsyncResult<void> {
        return this._db.insertOrUpdate(ctx, this._name, [
            {
                key: key as string,
                value,
            },
        ])
    }

    public async removeItem<K extends keyof Items>(
        ctx: Context,
        key: K,
    ): AsyncResult<void> {
        return this._db.delete(ctx, this._name, key as string)
    }

    public async clear(ctx: Context): AsyncResult<void> {
        let keys = await this._db.listKeys(ctx, this._name)
        if (!keys.ok) {
            return keys
        }

        for (let key of keys.value) {
            let deleted = await this._db.delete(ctx, this._name, key)
            if (!deleted.ok) {
                return deleted
            }
        }

        return Ok(undefined)
    }
}

export class IndexedDBKVStoreContainer<Stores extends string>
    implements KVStoreContainer<Stores>
{
    private _db!: IDBDatabase

    static async open<Stores extends string>(
        ctx: Context,
        name: string,
        stores: Stores[],
        version: number,
    ): AsyncResult<IndexedDBKVStoreContainer<Stores>> {
        let { resolve, reject, promise } = Promise.withResolvers<IDBDatabase>()

        let req = globalThis.indexedDB.open(name, version)

        req.addEventListener("error", () => {
            reject(
                new Error(
                    `error opening database "${name}@${version}": ${req.error?.message}`,
                ),
            )
        })

        req.addEventListener("success", () => {
            if (ctx.isCancelled()) {
                reject(ctx.err())
                return
            }
            resolve(req.result)
        })

        req.addEventListener("upgradeneeded", async () => {
            if (ctx.isCancelled()) {
                reject(ctx.err())
                return
            }

            let existing = new Set(Array.from(req.result.objectStoreNames))
            let requested = new Set<string>(stores)

            for (let store of existing.union(requested)) {
                if (ctx.isCancelled()) {
                    reject(ctx.err())
                    return
                }

                try {
                    // exists
                    if (existing.has(store) && requested.has(store)) {
                        continue
                    }

                    // removed
                    if (existing.has(store) && !requested.has(store)) {
                        req.result.deleteObjectStore(store)
                        continue
                    }

                    // new
                    if (!existing.has(store)) {
                        req.result.createObjectStore(store, {
                            keyPath: "key",
                        })
                    }
                } catch (err) {
                    reject(err)
                    return
                }
            }

            let tx = req.transaction
            if (tx) {
                let txResult = await wrapIDBTransaction(tx)
                if (!txResult.ok) {
                    reject(tx.error)
                    return
                }
            }

            if (ctx.isCancelled()) {
                tx?.abort()
                reject(ctx.err())
                return
            }

            resolve(req.result)
        })

        let db = await fromPromise(promise)
        if (!db.ok) {
            return db
        }

        let backing = new IndexedDBKVStoreContainer<Stores>()
        backing._db = db.value

        return Ok(backing)
    }

    public close() {
        return this._db.close()
    }

    public getKVStore<
        Items extends Record<string, unknown>,
        NotFoundError extends Error = never,
    >(
        name: Stores,
        opts: {
            instantiate?: <K extends keyof Items>(
                raw: Record<string, unknown> | ArrayBufferLike,
            ) => Result<Items[K]>
            NotFoundErr?: NotFoundError extends Error
                ? { new (key: string): NotFoundError }
                : never
        } = {},
    ): IndexDBKVStore<Stores, Items, NotFoundError> {
        return new IndexDBKVStore(name, this, opts)
    }

    public async insertOrUpdate<Item>(
        ctx: Context,
        storeName: Stores,
        data: KVRow<Item>[],
    ): AsyncResult<void> {
        return this._inTransaction(ctx, storeName, "readwrite", async (tx) => {
            let maybeStore = fromThrowing(() =>
                tx.objectStore(storeName as string),
            )
            if (!maybeStore.ok) {
                return maybeStore
            }
            let store = maybeStore.value

            for (let d of data) {
                if (ctx.isCancelled()) {
                    return Err(ctx.err() as Error)
                }

                let res = fromThrowing(() => store.put(d))
                if (!res.ok) {
                    return res
                }
            }

            return Ok(undefined)
        })
    }

    public async get<R>(
        ctx: Context,
        storeName: Stores,
        key: IDBValidKey,
    ): AsyncResult<KVRow<R> | undefined> {
        return this._inTransaction(ctx, storeName, "readonly", async (tx) => {
            let maybeStore = fromThrowing(() =>
                tx.objectStore(storeName as string),
            )
            if (!maybeStore.ok) {
                return maybeStore
            }

            let store = maybeStore.value

            let getReq = fromThrowing(() => store.get(key))
            if (!getReq.ok) {
                return getReq
            }

            return wrapIDBRequest(getReq.value)
        })
    }

    public async listKeys(
        ctx: Context,
        storeName: Stores,
    ): AsyncResult<IDBValidKey[]> {
        return this._inTransaction(ctx, storeName, "readonly", async (tx) => {
            let maybeStore = fromThrowing(() =>
                tx.objectStore(storeName as string),
            )
            if (!maybeStore.ok) {
                return maybeStore
            }

            let store = maybeStore.value

            let getKeysReq = fromThrowing(() => store.getAllKeys())
            if (!getKeysReq.ok) {
                return getKeysReq
            }

            let { resolve, reject, promise } =
                Promise.withResolvers<IDBValidKey[]>()

            getKeysReq.value.addEventListener("error", () => {
                reject(getKeysReq.value.error)
            })

            getKeysReq.value.addEventListener("success", () => {
                if (ctx.isCancelled()) {
                    reject(ctx.err())
                    return
                }
                resolve(getKeysReq.value.result)
            })

            return fromPromise(promise)
        })
    }

    public async delete(
        ctx: Context,
        storeName: Stores,
        key: IDBValidKey,
    ): AsyncResult<void> {
        return this._inTransaction(ctx, storeName, "readwrite", async (tx) => {
            let maybeStore = fromThrowing(() =>
                tx.objectStore(storeName as string),
            )
            if (!maybeStore.ok) {
                return maybeStore
            }

            let store = maybeStore.value

            let getReq = fromThrowing(() => store.delete(key))
            if (!getReq.ok) {
                return getReq
            }

            return wrapIDBRequest(getReq.value)
        })
    }

    private async _inTransaction<R>(
        ctx: Context,
        storeName: Stores,
        mode: IDBTransactionMode,
        fn: (tx: IDBTransaction) => AsyncResult<R>,
    ): AsyncResult<R> {
        if (ctx.isCancelled()) {
            return Err(ctx.err() as Error)
        }

        let abortErr: Error | undefined = undefined
        let result: R | undefined = undefined

        let maybeTx = fromThrowing(() =>
            this._db.transaction(storeName as string, mode),
        )
        if (!maybeTx.ok) {
            return maybeTx
        }

        let { resolve, reject, promise } = Promise.withResolvers<R>()

        let tx = maybeTx.value

        tx.addEventListener("abort", () => {
            reject(abortErr ?? tx.error)
        })

        tx.addEventListener("error", () => {
            reject(abortErr ?? tx.error)
        })

        tx.addEventListener("complete", () => {
            resolve(result as R)
        })

        let maybeResult = await fn(tx)
        if (!maybeResult.ok) {
            abortErr = maybeResult.err
            tx.abort()
            return fromPromise(promise)
        }

        result = maybeResult.value

        let commit = fromThrowing(() => tx.commit())
        if (!commit.ok) {
            reject(tx.error)
            return commit
        }

        return fromPromise(promise)
    }
}

function wrapIDBRequest<Req extends IDBRequest>(
    req: Req,
): AsyncResult<Req["result"]> {
    let { resolve, reject, promise } = Promise.withResolvers<Req["result"]>()
    req.addEventListener("error", () => {
        reject(req.error)
    })

    req.addEventListener("success", () => {
        resolve(req.result)
    })

    return fromPromise(promise)
}

function wrapIDBTransaction(tx: IDBTransaction): AsyncResult<void> {
    let { resolve, reject, promise } = Promise.withResolvers<void>()
    tx.addEventListener("error", () => {
        reject(tx.error)
    })

    tx.addEventListener("complete", () => {
        resolve()
    })

    return fromPromise(promise)
}
