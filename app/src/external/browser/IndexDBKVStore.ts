import type { KVStore, KVStoreContainer } from "@/lib/KVStore"
import type { Context } from "@/lib/context"
import {
    type AsyncResult,
    Err,
    Ok,
    type Result,
    fromPromise,
    fromThrowing,
    wrapErr,
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
        let [item, err] = await this._db.get<Items[K]>(
            ctx,
            this._name,
            key as string,
        )
        if (err) {
            return wrapErr`error getting item: ${key}: ${err}`
        }

        if (!item && typeof this.NotFoundErr === "function") {
            return Err(new this.NotFoundErr(key as string))
        }

        if (!item) {
            return Ok(item)
        }

        return this._instantiate(item.value as any)
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
        let [keys, err] = await this._db.listKeys(ctx, this._name)
        if (err) {
            return wrapErr`error listing keys: ${err}`
        }

        for (let key of keys) {
            let [_, deleteErr] = await this._db.delete(ctx, this._name, key)
            if (deleteErr) {
                return wrapErr`error deleting item: ${key}: ${deleteErr}`
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
                let [_, txErr] = await wrapIDBTransaction(tx)
                if (txErr) {
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

        let [db, openErr] = await fromPromise(promise)
        if (openErr) {
            return Err(openErr)
        }

        let backing = new IndexedDBKVStoreContainer<Stores>()
        backing._db = db

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
            let [store, storeErr] = fromThrowing(() =>
                tx.objectStore(storeName as string),
            )
            if (storeErr) {
                return wrapErr`error getting objectStore: ${storeName}: ${storeErr}`
            }

            for (let d of data) {
                if (ctx.isCancelled()) {
                    return Err(ctx.err() as Error)
                }

                let [_, putErr] = fromThrowing(() => store.put(d))
                if (putErr) {
                    return wrapErr`error putting data into store: ${storeName}: ${putErr}`
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
            let [store, storeErr] = fromThrowing(() =>
                tx.objectStore(storeName as string),
            )
            if (storeErr) {
                return wrapErr`error getting objectStore: ${storeName}: ${storeErr}`
            }

            let [item, err] = fromThrowing(() => store.get(key))
            if (err) {
                return wrapErr`error getting item from objectStore: ${storeName}: ${key}: ${err}`
            }

            return wrapIDBRequest(item)
        })
    }

    public async listKeys(
        ctx: Context,
        storeName: Stores,
    ): AsyncResult<IDBValidKey[]> {
        return this._inTransaction(ctx, storeName, "readonly", async (tx) => {
            let [store, storeErr] = fromThrowing(() =>
                tx.objectStore(storeName as string),
            )
            if (storeErr) {
                return wrapErr`error getting objectStore: ${storeName}: ${storeErr}`
            }

            let [keys, getAllKeysErr] = fromThrowing(() => store.getAllKeys())
            if (getAllKeysErr) {
                return wrapErr`error getting all keys for objectStore: ${storeName}: ${getAllKeysErr}`
            }

            let { resolve, reject, promise } =
                Promise.withResolvers<IDBValidKey[]>()

            keys.addEventListener("error", () => {
                reject(keys.error)
            })

            keys.addEventListener("success", () => {
                if (ctx.isCancelled()) {
                    reject(ctx.err())
                    return
                }
                resolve(keys.result)
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
            let [store, storeErr] = fromThrowing(() =>
                tx.objectStore(storeName as string),
            )
            if (storeErr) {
                return wrapErr`error getting objectStore: ${storeName}: ${storeErr}`
            }

            let [deleteRequest, err] = fromThrowing(() => store.delete(key))
            if (err) {
                return wrapErr`error deleting key from objectStore: ${storeName}: ${key}: ${err}`
            }

            return wrapIDBRequest(deleteRequest)
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

        let [tx, txErr] = fromThrowing(() =>
            this._db.transaction(storeName as string, mode),
        )
        if (txErr) {
            return wrapErr`error starting transaction: ${txErr}`
        }

        let { resolve, reject, promise } = Promise.withResolvers<R>()

        tx.addEventListener("abort", () => {
            reject(abortErr ?? tx.error)
        })

        tx.addEventListener("error", () => {
            reject(abortErr ?? tx.error)
        })

        tx.addEventListener("complete", () => {
            resolve(result as R)
        })

        let [value, err] = await fn(tx)
        if (err) {
            abortErr = err
            tx.abort()
            return fromPromise(promise)
        }

        result = value

        let [_, commitErr] = fromThrowing(() => tx.commit())
        if (commitErr) {
            reject(tx.error)
            return wrapErr`error comitting transacton: ${commitErr}}`
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
