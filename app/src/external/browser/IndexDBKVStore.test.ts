import { afterAll, assert, suite, test } from "vitest"
import { BaseContext } from "@/lib/context"

import { isErr } from "@/lib/errors"
import { assertErrResult, assertOkResult } from "@/lib/testhelper/assertions"
import { encodeText } from "@/lib/textencoding"

import { IndexedDBKVStoreContainer } from "./IndexDBKVStore"

suite("external/browser/IndexDBKVStore", { timeout: 5000 }, () => {
    let [ctx, cancel] = BaseContext.withCancel()
    afterAll(() => cancel())

    test("crud", async ({ onTestFinished }) => {
        let container = await assertOkResult(
            IndexedDBKVStoreContainer.open(
                ctx,
                "tests.IndexDBKVStore.crud",
                ["store-a", "store-b", "store-c"],
                1,
            ),
        )
        onTestFinished(async () => {
            container.close()
            await deleteIndexedDBDatabase("tests.IndexDBKVStore.crud")
        }, 1000)

        let kvs = {
            a: container.getKVStore<Record<`item-a-${string}`, { content: string }>>("store-a"),
            b: container.getKVStore<Record<`item-b-${string}`, string>>("store-b"),
            c: container.getKVStore<Record<`item-c-${string}`, { text: string }>>("store-c"),
        }

        for (let c of ["a", "b", "c"]) {
            await Promise.all([
                assertOkResult(
                    kvs.a.setItem(ctx, `item-a-${c}`, {
                        content: `content-a-${c}`,
                    }),
                ),
                assertOkResult(kvs.b.setItem(ctx, `item-b-${c}`, `content-b-${c}`)),
                assertOkResult(
                    kvs.c.setItem(ctx, `item-c-${c}`, {
                        text: `content-c-${c}`,
                    }),
                ),
            ])
        }

        for (let [name, kv] of Object.entries(kvs)) {
            for (let c of ["a", "b", "c"]) {
                switch (name) {
                    case "a": {
                        let item = await assertOkResult(
                            (kv as typeof kvs.a).getItem(ctx, `item-${name}-${c}`),
                        )
                        assert.equal(item?.content, `content-${name}-${c}`)
                        break
                    }
                    case "b": {
                        let item = await assertOkResult(
                            (kv as typeof kvs.b).getItem(ctx, `item-${name}-${c}`),
                        )
                        assert.equal(item, `content-${name}-${c}`)
                        break
                    }
                    case "c": {
                        let item = await assertOkResult(
                            (kv as typeof kvs.c).getItem(ctx, `item-${name}-${c}`),
                        )
                        assert.equal(item?.text, `content-${name}-${c}`)
                        break
                    }
                }
            }
        }

        for (let c of ["b", "c"]) {
            await Promise.all([
                assertOkResult(
                    kvs.a.setItem(ctx, `item-a-${c}`, {
                        content: `updated-a-${c}`,
                    }),
                ),
                assertOkResult(kvs.b.setItem(ctx, `item-b-${c}`, `updated-b-${c}`)),
                assertOkResult(
                    kvs.c.setItem(ctx, `item-c-${c}`, {
                        text: `updated-c-${c}`,
                    }),
                ),
            ])
        }

        for (let [name, kv] of Object.entries(kvs)) {
            for (let c of ["b", "c"]) {
                switch (name) {
                    case "a": {
                        let item = await assertOkResult(
                            (kv as typeof kvs.a).getItem(ctx, `item-${name}-${c}`),
                        )
                        assert.equal(item?.content, `updated-${name}-${c}`)
                        break
                    }
                    case "b": {
                        let item = await assertOkResult(
                            (kv as typeof kvs.b).getItem(ctx, `item-${name}-${c}`),
                        )
                        assert.equal(item, `updated-${name}-${c}`)
                        break
                    }
                    case "c": {
                        let item = await assertOkResult(
                            (kv as typeof kvs.c).getItem(ctx, `item-${name}-${c}`),
                        )
                        assert.equal(item?.text, `updated-${name}-${c}`)
                        break
                    }
                }
            }
        }

        for (let c of ["a", "c"]) {
            await Promise.all([
                assertOkResult(kvs.a.removeItem(ctx, `item-a-${c}`)),
                assertOkResult(kvs.b.removeItem(ctx, `item-b-${c}`)),
                assertOkResult(kvs.c.removeItem(ctx, `item-c-${c}`)),
            ])
        }

        for (let [name, kv] of Object.entries(kvs)) {
            for (let c of ["a", "c"]) {
                switch (name) {
                    case "a": {
                        let item = await assertOkResult(
                            (kv as typeof kvs.a).getItem(ctx, `item-${name}-${c}`),
                        )
                        assert.isUndefined(item)
                        break
                    }
                    case "b": {
                        let item = await assertOkResult(
                            (kv as typeof kvs.b).getItem(ctx, `item-${name}-${c}`),
                        )
                        assert.isUndefined(item)
                        break
                    }
                    case "c": {
                        let item = await assertOkResult(
                            (kv as typeof kvs.c).getItem(ctx, `item-${name}-${c}`),
                        )
                        assert.isUndefined(item)
                        break
                    }
                }
            }
        }
    })

    test("custom not found error", async ({ onTestFinished }) => {
        let container = await assertOkResult(
            IndexedDBKVStoreContainer.open(
                ctx,
                "tests.IndexDBKVStore.custom-not-found-error",
                ["custom-not-found-error"],
                1,
            ),
        )
        onTestFinished(async () => {
            container.close()
            await deleteIndexedDBDatabase("tests.IndexDBKVStore.custom-not-found-error")
        }, 1000)

        class NotFoundErr extends Error {
            constructor(key: string) {
                super(`not found: ${key}`)
            }
        }

        let kv = container.getKVStore<never, NotFoundErr>("custom-not-found-error", { NotFoundErr })

        let err = await assertErrResult(kv.getItem(ctx, "not-found"))

        assert.isTrue(isErr(err, NotFoundErr))
    })

    test("binary data", async ({ onTestFinished }) => {
        let container = await assertOkResult(
            IndexedDBKVStoreContainer.open(ctx, "tests.IndexDBKVStore.binary_data", ["store-a"], 1),
        )
        onTestFinished(async () => {
            container.close()
            await deleteIndexedDBDatabase("tests.IndexDBKVStore.binary_data")
        }, 1000)

        let kv = container.getKVStore("store-a")

        await assertOkResult(kv.setItem(ctx, "item-a", encodeText("Content Item A")))

        let item = await assertOkResult(kv.getItem(ctx, "item-a"))
        assert.deepEqual(item, encodeText("Content Item A"))
    })

    test("non existing store", async ({ onTestFinished, expect }) => {
        let container = await assertOkResult(
            IndexedDBKVStoreContainer.open<"store-a" | "non-existing">(
                ctx,
                "tests.IndexDBKVStore.non-existing-store",
                ["store-a"],
                1,
            ),
        )
        onTestFinished(async () => {
            container.close()
            await deleteIndexedDBDatabase("tests.IndexDBKVStore.non-existing-store")
        }, 1000)

        await expect(async () => {
            let kv = container.getKVStore("non-existing")
            await assertOkResult(kv.setItem(ctx, "item-a", encodeText("Content Item A")))
        }).rejects.toThrow()
    })
})

suite("external/browser/IndexDBKVStore/IndexedDBKVStoreContainer", { timeout: 5000 }, () => {
    let [ctx, cancel] = BaseContext.withCancel()
    afterAll(() => cancel())

    test("auto migrations", async ({ onTestFinished }) => {
        let opened: IndexedDBKVStoreContainer<any>[] = []
        onTestFinished(async () => {
            opened.forEach((c) => c.close())
            await deleteIndexedDBDatabase("tests.auto_migrations")
        }, 1000)

        let containerV1 = await assertOkResult(
            IndexedDBKVStoreContainer.open(ctx, "tests.auto_migrations", ["a", "b", "c"], 1),
        )
        opened.push(containerV1)
        containerV1.close()

        let containerV1Again = await assertOkResult(
            IndexedDBKVStoreContainer.open(ctx, "tests.auto_migrations", ["a", "b", "c"], 1),
        )
        opened.push(containerV1Again)
        containerV1Again.close()

        let containerV2 = await assertOkResult(
            IndexedDBKVStoreContainer.open(ctx, "tests.auto_migrations", ["a", "b", "c", "d"], 2),
        )
        opened.push(containerV2)
        containerV2.close()

        let containerV3 = await assertOkResult(
            IndexedDBKVStoreContainer.open(ctx, "tests.auto_migrations", ["a", "b", "d"], 3),
        )
        opened.push(containerV3)
        containerV3.close()
    })
})

function deleteIndexedDBDatabase(name: string) {
    let { resolve, reject, promise } = Promise.withResolvers<void>()
    let req = globalThis.indexedDB.deleteDatabase(name)
    req.addEventListener("error", () => {
        reject(req.error)
    })

    req.addEventListener("success", () => {
        resolve()
    })

    return promise
}
