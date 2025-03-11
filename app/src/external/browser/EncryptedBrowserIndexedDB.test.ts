import { BaseContext } from "@/lib/context"
import { assert, afterAll, suite, test } from "vitest"

import { assertOkResult } from "@/lib/testhelper/assertions"

import { AgeCrypto } from "../age/AgeCrypto"
import { EncryptedBrowserIndexedDB } from "./EncryptedBrowserIndexedDB"

suite.concurrent(
    "external/browser/EncryptedBrowserIndexedDB",
    { timeout: 5000 },
    () => {
        let [ctx, cancel] = BaseContext.withCancel()
        afterAll(() => cancel())

        test("crud", { timeout: 5000 }, async ({ onTestFinished }) => {
            let crypto = new AgeCrypto()
            await crypto.init("external/browser/EncryptedBrowserIndexedDB/crud")
            let idb = new EncryptedBrowserIndexedDB<{
                title: string
                content: string
            }>({
                name: "external.browser.EncryptedBrowserIndexedDB.crud",
                crypto,
                keyFrom: (d) => d.title,
            })
            onTestFinished(async () => {
                idb.close()
                await deleteIndexedDBDatabase(
                    "external.browser.EncryptedBrowserIndexedDB.crud",
                )
            })

            await assertOkResult(idb.open(ctx))

            await assertOkResult(
                idb.insertOrUpdate(ctx, [
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

            let single = await assertOkResult(idb.get(ctx, "Item A"))
            assert.deepEqual(single, {
                title: "Item A",
                content: "Content Item A",
            })

            await assertOkResult(
                idb.insertOrUpdate(ctx, [
                    {
                        title: "Item A",
                        content: "Updated Content A",
                    },
                ]),
            )

            let updated = await assertOkResult(idb.get(ctx, "Item A"))
            assert.deepEqual(updated, {
                title: "Item A",
                content: "Updated Content A",
            })

            await assertOkResult(idb.delete(ctx, "Item A"))

            let deleted = await assertOkResult(idb.get(ctx, "Item A"))
            assert.equal(deleted, undefined)
        })
    },
)

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
