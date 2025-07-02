import { assert, afterAll, suite, test } from "vitest"

import { AgeCrypto } from "@/external/age/AgeCrypto"
import { BaseContext } from "@/lib/context"
import { toPromise } from "@/lib/result"
import { TestInMemKVStore } from "@/lib/testhelper/TestInMemKVStore"
import { assertOkResult } from "@/lib/testhelper/assertions"

import { encodeText } from "../textencoding"
import { EncryptedKVStore } from "./EncryptedKVStore"

suite("lib/KVStore/EncryptedKVStore", () => {
    let [ctx, cancel] = BaseContext.withCancel()
    afterAll(() => cancel())

    test("crud", async () => {
        let backingKV = new TestInMemKVStore<Record<"a" | "b", ArrayBufferLike>>()

        let crypto = new AgeCrypto()
        await crypto.init(await toPromise(crypto.generatePrivateKey()))
        let kv = new EncryptedKVStore<
            Record<
                "a" | "b",
                {
                    text: string
                    num: number
                    nested: {
                        bool: boolean
                        text: string
                    }
                }
            >
        >({
            kv: backingKV,
            crypto,
        })

        let value = {
            text: "text-a",
            num: 1234,
            nested: {
                bool: false,
                text: "nested-text-a",
            },
        }

        await assertOkResult(kv.setItem(ctx, "a", value))

        let backingItem = await assertOkResult(backingKV.getItem(ctx, "a"))
        assert.isTrue(backingItem instanceof ArrayBuffer)
        assert.notDeepEqual(encodeText(JSON.stringify(value)).buffer, backingItem)

        let item = await assertOkResult(kv.getItem(ctx, "a"))
        assert.deepEqual(item, value)

        let updated = {
            text: "text-a-changed",
            num: 6542,
            nested: {
                bool: true,
                text: "changed-nested-text-a",
            },
        }

        await assertOkResult(kv.setItem(ctx, "a", updated))

        item = await assertOkResult(kv.getItem(ctx, "a"))
        assert.deepEqual(item, updated)

        await assertOkResult(kv.removeItem(ctx, "a"))

        item = await assertOkResult(kv.getItem(ctx, "a"))
        assert.isUndefined(item)
    })
})
