import type { Context } from "@/lib/context"
import {
    type AsyncResult,
    Err,
    Ok,
    fromPromise,
    fromThrowing,
} from "@/lib/result"

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

                let res = await migration(req.result)
                if (!res.ok) {
                    reject(res.err)
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

        let indexedDB = new IndexedDB<Tables>()
        indexedDB._db = db.value

        return Ok(indexedDB)
    }

    public async insertOrUpdate<T extends keyof Tables>(
        ctx: Context,
        storeName: T,
        data: Tables[T][],
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

    public async get<T extends keyof Tables>(
        ctx: Context,
        storeName: T,
        key: IDBValidKey,
    ): AsyncResult<Tables[T] | undefined> {
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

    public async query<T extends keyof Tables>(
        ctx: Context,
        storeName: T,
        predicate: (item: Tables[T]) => boolean,
    ): AsyncResult<Tables[T][]> {
        return this._inTransaction(ctx, storeName, "readonly", async (tx) => {
            let maybeStore = fromThrowing(() =>
                tx.objectStore(storeName as string),
            )
            if (!maybeStore.ok) {
                return maybeStore
            }

            let store = maybeStore.value

            let getAllReq = fromThrowing(() => store.getAll())
            if (!getAllReq.ok) {
                return getAllReq
            }

            let { resolve, reject, promise } =
                Promise.withResolvers<Tables[T][]>()

            getAllReq.value.addEventListener("error", () => {
                reject(getAllReq.value.error)
            })

            getAllReq.value.addEventListener("success", () => {
                let items: Tables[T][] = []

                for (let item of getAllReq.value.result) {
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

    public async delete<T extends keyof Tables>(
        ctx: Context,
        storeName: T,
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
