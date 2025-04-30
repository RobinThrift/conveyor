import { awaitWithAbort } from "@/lib/awaitWithAbort"
import { BaseContext, type Context } from "@/lib/context"
import { Second } from "@/lib/duration"
import { type AsyncResult, Ok, fromPromise } from "@/lib/result"
import { decodeText, encodeText } from "@/lib/textencoding"
import { createWorker, isWorkerContext } from "@/lib/worker"
import { IndexedDB } from "./indexedDB/IndexedDB"

type Tables = {
    keys: { name: string; key: globalThis.CryptoKeyPair }
    items: { key: string; data: ArrayBuffer }
}

const _db: Promise<IndexedDB<Tables>> = (async () => {
    if (!isWorkerContext()) {
        return undefined as any
    }

    let db = await IndexedDB.open<Tables>(
        BaseContext,
        "conveyor-secure-storage",
        [
            async (db) => {
                db.createObjectStore("keys", {
                    keyPath: "name",
                })
                db.createObjectStore("items", {
                    keyPath: "key",
                })
                return Ok(undefined)
            },
        ],
    )

    if (!db.ok) {
        throw db.err
    }

    return db.value
})()

const localCryptoKey = Promise.withResolvers<globalThis.CryptoKeyPair>()

export const WebCryptoDeviceSecureStorageWorker = createWorker({
    init: async (ctx: Context): AsyncResult<void> => {
        let db = await _db
        let cryptoKey = await db.get(ctx, "keys", "local-key-v1")
        if (!cryptoKey.ok) {
            return cryptoKey
        }

        if (cryptoKey.value) {
            localCryptoKey.resolve(cryptoKey.value.key)
            return Ok(undefined)
        }

        generateLocalCryptoKey()

        let genretedKey = await fromPromise(localCryptoKey.promise)
        if (!genretedKey.ok) {
            return genretedKey
        }

        return db.insertOrUpdate(ctx, "keys", [
            { name: "local-key-v1", key: genretedKey.value },
        ])
    },

    reset: async (ctx: Context): AsyncResult<void> => {
        let db = await _db

        let keys = await db.listKeys(ctx, "keys")
        if (!keys.ok) {
            return keys
        }

        for (let key of keys.value) {
            let deleted = await db.delete(ctx, "keys", key)
            if (!deleted.ok) {
                return deleted
            }
        }

        let items = await db.listKeys(ctx, "items")
        if (!items.ok) {
            return items
        }

        for (let item of items.value) {
            let deleted = await db.delete(ctx, "items", item)
            if (!deleted.ok) {
                return deleted
            }
        }

        return Ok(undefined)
    },

    getItem: async (
        baseCtx: Context,
        { key }: { key: string },
    ): AsyncResult<string | undefined> => {
        let [ctx, cancel] = baseCtx.withTimeout(Second * 5)
        let db = await _db
        let cryptoKey = await fromPromise(
            awaitWithAbort(localCryptoKey.promise, ctx.signal),
        )
        if (!cryptoKey.ok) {
            return cryptoKey
        }

        let item = await db.get(ctx, "items", key)
        cancel()
        if (!item.ok) {
            return item
        }

        if (!item.value) {
            return Ok(undefined)
        }

        let plaintext = await fromPromise(
            decryptData(cryptoKey.value, item.value.data),
        )
        if (!plaintext.ok) {
            return plaintext
        }

        return Ok(decodeText(plaintext.value))
    },

    setItem: async (
        baseCtx: Context,
        { key, value }: { key: string; value: string },
    ): AsyncResult<void> => {
        let [ctx, cancel] = baseCtx.withTimeout(Second * 5)
        let db = await _db
        let cryptoKey = await fromPromise(
            awaitWithAbort(localCryptoKey.promise, ctx.signal),
        )
        if (!cryptoKey.ok) {
            cancel()
            return cryptoKey
        }

        let ciphertext = await fromPromise(
            encryptData(cryptoKey.value, encodeText(value)),
        )
        if (!ciphertext.ok) {
            cancel()
            return ciphertext
        }

        let insterted = await db.insertOrUpdate(ctx, "items", [
            { key, data: ciphertext.value },
        ])
        cancel()
        return insterted
    },

    removeItem: async (
        ctx: Context,
        { key }: { key: string },
    ): AsyncResult<void> => {
        let db = await _db

        return db.delete(ctx, "items", key)
    },
})

WebCryptoDeviceSecureStorageWorker.runIfWorker()

async function generateLocalCryptoKey() {
    let cryptoKey = await fromPromise(
        globalThis.crypto.subtle.generateKey({ name: "X25519" }, false, [
            "deriveKey",
        ]) as Promise<CryptoKeyPair>,
    )

    if (!cryptoKey.ok) {
        localCryptoKey.reject(cryptoKey.err)
        return
    }

    localCryptoKey.resolve(cryptoKey.value)
}
const IV_LEN = 12

async function encryptData(
    keyPair: CryptoKeyPair,
    data: Uint8Array,
): Promise<ArrayBuffer> {
    let iv = generateIV()
    let key = await deriveKey(keyPair)

    let encrypted = await globalThis.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        data,
    )

    let buf = new ArrayBuffer(iv.byteLength + encrypted.byteLength)
    let bufarr = new Uint8Array(buf)
    bufarr.set(iv, 0)
    bufarr.set(new Uint8Array(encrypted), iv.byteLength)

    return buf
}

async function decryptData(
    keyPair: CryptoKeyPair,
    data: ArrayBuffer,
): Promise<ArrayBuffer> {
    const iv = data.slice(0, IV_LEN)
    const encrypted = data.slice(IV_LEN)
    let key = await deriveKey(keyPair)

    let decrypted = await globalThis.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encrypted,
    )

    return decrypted
}

function generateIV() {
    return globalThis.crypto.getRandomValues(new Uint8Array(IV_LEN))
}

function deriveKey(keyPair: CryptoKeyPair) {
    return globalThis.crypto.subtle.deriveKey(
        {
            name: "X25519",
            public: keyPair.publicKey,
        },
        keyPair.privateKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
    )
}
