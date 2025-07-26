import { afterAll, assert, suite, test, vi } from "vitest"
import { BaseContext } from "@/lib/context"

import { Ok } from "@/lib/result"
import { assertErrResult, assertOkResult } from "@/lib/testhelper/assertions"
import { encodeText } from "@/lib/textencoding"

import { IndexedDB } from "./IndexedDB"

suite("external/browser/IndexedDB", { timeout: 5000 }, () => {
    let [ctx, cancel] = BaseContext.withCancel()
    afterAll(() => cancel())

    test("migrations", { timeout: 5000 }, async ({ onTestFinished }) => {
        let idb: IndexedDB<any> | undefined
        onTestFinished(async () => {
            idb?.close()
            await deleteIndexedDBDatabase("tests.migration")
        }, 1000)

        let spy = vi.fn()

        idb = await assertOkResult(
            IndexedDB.open(ctx, "tests.migration", [
                async (db) => {
                    spy(1)
                    db.createObjectStore("items-a", {
                        keyPath: "title",
                    })
                    return Ok(undefined)
                },
                async (db) => {
                    spy(2)
                    db.createObjectStore("items-b")
                    return Ok(undefined)
                },
            ]),
        )

        assert.equal(spy.mock.calls[0][0], 1)
        assert.equal(spy.mock.calls[1][0], 2)

        idb?.close()

        idb = await assertOkResult(
            IndexedDB.open(ctx, "tests.migration", [
                async (db) => {
                    spy(1)
                    db.createObjectStore("items-a", {
                        keyPath: "title",
                    })
                    return Ok(undefined)
                },
                async (db) => {
                    spy(2)
                    db.createObjectStore("items-b")
                    return Ok(undefined)
                },
                async (db) => {
                    spy(3)
                    db.createObjectStore("items-c")
                    return Ok(undefined)
                },
                async (db) => {
                    spy(4)
                    db.createObjectStore("items-d")
                    return Ok(undefined)
                },
            ]),
        )

        assert.equal(spy.mock.calls[2][0], 3)
        assert.equal(spy.mock.calls[3][0], 4)
    })

    test("query", { timeout: 5000 }, async ({ onTestFinished }) => {
        let idb:
            | IndexedDB<{
                  items: { title: string; content: string }
              }>
            | undefined
        onTestFinished(async () => {
            idb?.close()
            await deleteIndexedDBDatabase("tests.query")
        })

        idb = await assertOkResult(
            IndexedDB.open(ctx, "tests.query", [
                async (db) => {
                    db.createObjectStore("items", {
                        keyPath: "title",
                    })
                    return Ok(undefined)
                },
            ]),
        )

        await assertOkResult(
            idb.insertOrUpdate(ctx, "items", [
                {
                    title: "Item A",
                    content: "Content Item A",
                },
                {
                    title: "Item B",
                    content: "Content Item B",
                },
            ]),
        )

        let single = await assertOkResult(idb.get(ctx, "items", "Item A"))
        assert.deepEqual(single, {
            title: "Item A",
            content: "Content Item A",
        })

        let multiple = await assertOkResult(
            idb.query(ctx, "items", (item) => item.title.startsWith("Item")),
        )

        assert.deepEqual(multiple, [
            {
                title: "Item A",
                content: "Content Item A",
            },
            {
                title: "Item B",
                content: "Content Item B",
            },
        ])
    })

    test("update", { timeout: 5000 }, async ({ onTestFinished }) => {
        let idb:
            | IndexedDB<{
                  items: { title: string; content: string }
              }>
            | undefined
        onTestFinished(async () => {
            idb?.close()
            await deleteIndexedDBDatabase("tests.update")
        })

        idb = await assertOkResult(
            IndexedDB.open(ctx, "tests.update", [
                async (db) => {
                    db.createObjectStore("items", {
                        keyPath: "title",
                    })
                    return Ok(undefined)
                },
            ]),
        )

        await assertOkResult(
            idb.insertOrUpdate(ctx, "items", [
                {
                    title: "Item A",
                    content: "Content Item A",
                },
                {
                    title: "Item B",
                    content: "Content Item B",
                },
            ]),
        )

        let initial = await assertOkResult(idb.get(ctx, "items", "Item A"))
        assert.deepEqual(initial, {
            title: "Item A",
            content: "Content Item A",
        })

        await assertOkResult(
            idb.insertOrUpdate(ctx, "items", [
                {
                    title: "Item A",
                    content: "Updated Content A",
                },
            ]),
        )

        let updated = await assertOkResult(idb.get(ctx, "items", "Item A"))
        assert.deepEqual(updated, {
            title: "Item A",
            content: "Updated Content A",
        })
    })

    test("insert error", { timeout: 5000 }, async ({ onTestFinished }) => {
        let idb:
            | IndexedDB<{
                  items: { title?: string; content: string }
              }>
            | undefined
        onTestFinished(async () => {
            idb?.close()
            await deleteIndexedDBDatabase("tests.insert_error")
        })

        idb = await assertOkResult(
            IndexedDB.open(ctx, "tests.insert_error", [
                async (db) => {
                    db.createObjectStore("items", {
                        keyPath: "title",
                    })
                    return Ok(undefined)
                },
            ]),
        )

        await assertErrResult(
            idb.insertOrUpdate(ctx, "items", [
                {
                    content: "Content Item A",
                },
            ]),
        )
    })

    test("delete", { timeout: 5000 }, async ({ onTestFinished }) => {
        let idb:
            | IndexedDB<{
                  items: { title: string; content: string }
              }>
            | undefined
        onTestFinished(async () => {
            idb?.close()
            await deleteIndexedDBDatabase("tests.delete")
        })

        idb = await assertOkResult(
            IndexedDB.open(ctx, "tests.delete", [
                async (db) => {
                    db.createObjectStore("items", {
                        keyPath: "title",
                    })
                    return Ok(undefined)
                },
            ]),
        )

        await assertOkResult(
            idb.insertOrUpdate(ctx, "items", [
                {
                    title: "Item A",
                    content: "Content Item A",
                },
                {
                    title: "Item B",
                    content: "Content Item B",
                },
            ]),
        )

        await assertOkResult(idb.delete(ctx, "items", "Item A"))

        let deleted = await assertOkResult(idb.get(ctx, "items", "Item A"))
        assert.equal(deleted, undefined)
    })

    test("binary data", { timeout: 5000 }, async ({ onTestFinished }) => {
        let idb:
            | IndexedDB<{
                  items: { title: string; content: Uint8Array<ArrayBufferLike> }
              }>
            | undefined
        onTestFinished(async () => {
            idb?.close()
            await deleteIndexedDBDatabase("tests.binary_data")
        })

        idb = await assertOkResult(
            IndexedDB.open(ctx, "tests.binary_data", [
                async (db) => {
                    db.createObjectStore("items", {
                        keyPath: "title",
                    })
                    return Ok(undefined)
                },
            ]),
        )

        await assertOkResult(
            idb.insertOrUpdate(ctx, "items", [
                {
                    title: "Item A",
                    content: encodeText("Content Item A"),
                },
            ]),
        )

        let item = await assertOkResult(idb.get(ctx, "items", "Item A"))
        assert.deepEqual(item, {
            title: "Item A",
            content: encodeText("Content Item A"),
        })
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
