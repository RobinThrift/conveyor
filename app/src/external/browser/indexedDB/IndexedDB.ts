import type { Context } from "@/lib/context"
import { type AsyncResult, Err, Ok, fromPromise, fromThrowing, wrapErr } from "@/lib/result"

type IndexedDBMigration = (db: IDBDatabase) => AsyncResult<void>

export class IndexedDB<Tables extends Record<string, unknown>> {
    private _db!: IDBDatabase

    public close() {
        return this._db.close()
    }

    static async open<Tables extends Record<string, unknown>>(
        ctx: Context,
        name: string,
        migrations: IndexedDBMigration[],
    ): AsyncResult<IndexedDB<Tables>> {
        let { resolve, reject, promise } = Promise.withResolvers<IDBDatabase>()

        let version = migrations.length

        let req = globalThis.indexedDB.open(name, version)

        req.addEventListener("error", () => {
            reject(new Error(`error opening database "${name}@${version}": ${req.error?.message}`))
        })

        req.addEventListener("success", () => {
            if (ctx.isCancelled()) {
                reject(ctx.err())
                return
            }
            resolve(req.result)
        })

        req.addEventListener("upgradeneeded", async (evt) => {
            if (ctx.isCancelled()) {
                reject(ctx.err())
                return
            }

            let toApply = migrations.slice(Math.max(evt.oldVersion, 0))
            if (toApply.length === 0) {
                return
            }

            for (let migration of toApply) {
                if (ctx.isCancelled()) {
                    reject(ctx.err())
                    return
                }

                let [_, err] = await migration(req.result)
                if (err) {
                    reject(err)
                    return
                }
            }

            let tx = req.transaction
            if (tx) {
                let [_, txErr] = await wrapIDBTransaction(tx)
                if (txErr) {
                    reject(txErr)
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

        let [db, err] = await fromPromise(promise)
        if (err) {
            return Err(err)
        }

        let indexedDB = new IndexedDB<Tables>()
        indexedDB._db = db

        return Ok(indexedDB)
    }

    public async insertOrUpdate<T extends keyof Tables>(
        ctx: Context,
        storeName: T,
        data: Tables[T][],
    ): AsyncResult<void> {
        return this._inTransaction(ctx, storeName, "readwrite", async (tx) => {
            let [store, storeErr] = fromThrowing(() => tx.objectStore(storeName as string))
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

    public async get<T extends keyof Tables>(
        ctx: Context,
        storeName: T,
        key: IDBValidKey,
    ): AsyncResult<Tables[T] | undefined> {
        return this._inTransaction(ctx, storeName, "readonly", async (tx) => {
            let [store, storeErr] = fromThrowing(() => tx.objectStore(storeName as string))
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

    public async query<T extends keyof Tables>(
        ctx: Context,
        storeName: T,
        predicate: (item: Tables[T]) => boolean,
    ): AsyncResult<Tables[T][]> {
        return this._inTransaction(ctx, storeName, "readonly", async (tx) => {
            let [store, storeErr] = fromThrowing(() => tx.objectStore(storeName as string))
            if (storeErr) {
                return wrapErr`error getting objectStore: ${storeName}: ${storeErr}`
            }

            let [all, err] = fromThrowing(() => store.getAll())
            if (err) {
                return wrapErr`error getting all items from objectStore: ${storeName}: ${err}`
            }

            let { resolve, reject, promise } = Promise.withResolvers<Tables[T][]>()

            all.addEventListener("error", () => {
                reject(all.error)
            })

            all.addEventListener("success", () => {
                let items: Tables[T][] = []

                for (let item of all.result) {
                    if (predicate(item)) {
                        items.push(item)
                    }
                }

                resolve(items)
            })

            return fromPromise(promise)
        })
    }

    public async listKeys<T extends keyof Tables>(
        ctx: Context,
        storeName: T,
    ): AsyncResult<IDBValidKey[]> {
        return this._inTransaction(ctx, storeName, "readonly", async (tx) => {
            let [store, storeErr] = fromThrowing(() => tx.objectStore(storeName as string))
            if (storeErr) {
                return wrapErr`error getting objectStore: ${storeName}: ${storeErr}`
            }

            let [keys, getAllKeysErr] = fromThrowing(() => store.getAllKeys())
            if (getAllKeysErr) {
                return wrapErr`error getting all keys for objectStore: ${storeName}: ${getAllKeysErr}`
            }

            let { resolve, reject, promise } = Promise.withResolvers<IDBValidKey[]>()

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

    public async delete<T extends keyof Tables>(
        ctx: Context,
        storeName: T,
        key: IDBValidKey,
    ): AsyncResult<void> {
        return this._inTransaction(ctx, storeName, "readwrite", async (tx) => {
            let [store, storeErr] = fromThrowing(() => tx.objectStore(storeName as string))
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

    private async _inTransaction<S extends keyof Tables, R>(
        ctx: Context,
        storeName: S,
        mode: IDBTransactionMode,
        fn: (tx: IDBTransaction) => AsyncResult<R>,
    ): AsyncResult<R> {
        if (ctx.isCancelled()) {
            return Err(ctx.err() as Error)
        }

        let abortErr: Error | undefined = undefined
        let result: R | undefined = undefined

        let [tx, txErr] = fromThrowing(() => this._db.transaction(storeName as string, mode))
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

function wrapIDBRequest<Req extends IDBRequest>(req: Req): AsyncResult<Req["result"]> {
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
