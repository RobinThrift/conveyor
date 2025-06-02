import { awaitWithAbort } from "@/lib/awaitWithAbort"
import { BaseContext, type Context } from "@/lib/context"
import { Second } from "@/lib/duration"
import { type AsyncResult, Err, Ok, fromPromise, wrapErr } from "@/lib/result"
import { decodeText, encodeText } from "@/lib/textencoding"
import { createWorker, isWorkerContext } from "@/lib/worker"
import { IndexedDB } from "./indexedDB/IndexedDB"

type Tables = {
    keys: { name: string; key: globalThis.CryptoKeyPair }
    items: { key: string; data: ArrayBuffer }
}

const LOCAL_KEY_V1_NAME = "local-key-v1"

const _db: Promise<IndexedDB<Tables>> = (async () => {
    if (!isWorkerContext()) {
        return undefined as any
    }

    let [db, err] = await IndexedDB.open<Tables>(
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

    if (err) {
        throw err
    }

    return db
})()

const localCryptoKey = Promise.withResolvers<globalThis.CryptoKeyPair>()

export const WebCryptoDeviceSecureStorageWorker = createWorker({
    init: async (ctx: Context): AsyncResult<void> => {
        let db = await _db
        let [cryptoKey, cryptoKeyErr] = await db.get(
            ctx,
            "keys",
            LOCAL_KEY_V1_NAME,
        )
        if (cryptoKeyErr) {
            return wrapErr`error initialising: ${cryptoKey}`
        }

        if (cryptoKey) {
            localCryptoKey.resolve(cryptoKey.key)
            return Ok(undefined)
        }

        let [generatedKey, generatedKeyErr] = await generateLocalCryptoKey()
        if (generatedKeyErr) {
            return wrapErr`error generating key: ${generatedKeyErr}`
        }

        let [_, insertedErr] = await db.insertOrUpdate(ctx, "keys", [
            { name: LOCAL_KEY_V1_NAME, key: generatedKey },
        ])

        if (insertedErr) {
            if (
                insertedErr.name === "DataError" ||
                (insertedErr.cause as Error)?.name === "DataErro"
            ) {
                ;[generatedKey, generatedKeyErr] =
                    await generateECDHLocalCryptoKey()
                if (generatedKeyErr) {
                    return wrapErr`error generating key: ${generatedKeyErr}`
                }
                ;[_, insertedErr] = await db.insertOrUpdate(ctx, "keys", [
                    { name: LOCAL_KEY_V1_NAME, key: generatedKey },
                ])
            }
        }

        if (insertedErr) {
            localCryptoKey.reject(insertedErr)
            return wrapErr`error inserting key: ${insertedErr}`
        }

        localCryptoKey.resolve(generatedKey)

        return Ok(undefined)
    },

    reset: async (ctx: Context): AsyncResult<void> => {
        let db = await _db

        let [keys, keysErr] = await db.listKeys(ctx, "keys")
        if (keysErr) {
            return wrapErr`error resetting: error listing keys: ${keysErr}`
        }

        for (let key of keys) {
            let [_, deletedErr] = await db.delete(ctx, "keys", key)
            if (deletedErr) {
                return wrapErr`error resetting: ${deletedErr}`
            }
        }

        let [items, itemsErr] = await db.listKeys(ctx, "items")
        if (itemsErr) {
            return wrapErr`error resetting: error listing items: ${itemsErr}`
        }

        for (let item of items) {
            let [_, deletedErr] = await db.delete(ctx, "items", item)
            if (deletedErr) {
                return wrapErr`error resetting: ${deletedErr}`
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
        let [cryptoKey, cryptoKeyErr] = await fromPromise(
            awaitWithAbort(localCryptoKey.promise, ctx.signal),
        )
        if (cryptoKeyErr) {
            cancel()
            return Err(cryptoKeyErr)
        }

        let [item, err] = await db.get(ctx, "items", key)
        cancel()
        if (err) {
            return wrapErr`error getting item from db: ${key}: ${err}`
        }

        if (!item) {
            return Ok(undefined)
        }

        let [plaintext, decryptErr] = await fromPromise(
            decryptData(cryptoKey, item.data),
        )
        if (decryptErr) {
            return wrapErr`error decrypting data: ${key}: ${decryptErr}`
        }

        return Ok(decodeText(plaintext))
    },

    setItem: async (
        baseCtx: Context,
        { key, value }: { key: string; value: string },
    ): AsyncResult<void> => {
        let [ctx, cancel] = baseCtx.withTimeout(Second * 5)
        let db = await _db
        let [cryptoKey, cryptoKeyErr] = await fromPromise(
            awaitWithAbort(localCryptoKey.promise, ctx.signal),
        )
        if (cryptoKeyErr) {
            cancel()
            return Err(cryptoKeyErr)
        }

        let [ciphertext, encryptErr] = await fromPromise(
            encryptData(cryptoKey, encodeText(value)),
        )
        if (encryptErr) {
            cancel()
            return wrapErr`error encrypting data: ${encryptErr}`
        }

        let insterted = await db.insertOrUpdate(ctx, "items", [
            { key, data: ciphertext },
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

async function generateLocalCryptoKey(): AsyncResult<CryptoKeyPair> {
    let [cryptoKey, err] = await generateX25519LocalCryptoKey()
    if (err) {
        if (
            err.name === "NotSupportedError" ||
            (err.cause as Error)?.name === "NotSupportedError"
        ) {
            ;[cryptoKey, err] = await generateECDHLocalCryptoKey()
        }
    }

    return Ok(cryptoKey)
}

async function generateX25519LocalCryptoKey(): AsyncResult<CryptoKeyPair> {
    let [cryptoKey, err] = await fromPromise(
        globalThis.crypto.subtle.generateKey({ name: "X25519" }, false, [
            "deriveKey",
        ]) as Promise<CryptoKeyPair>,
    )

    if (err) {
        return wrapErr`error generating X25519 key: ${err}`
    }

    return [cryptoKey, err]
}

async function generateECDHLocalCryptoKey(): AsyncResult<CryptoKeyPair> {
    let [cryptoKey, err] = await fromPromise(
        globalThis.crypto.subtle.generateKey(
            { name: "ECDH", namedCurve: "P-384" },
            false,
            ["deriveKey"],
        ) as Promise<CryptoKeyPair>,
    )

    if (err) {
        return wrapErr`error generating ECDH key using P-384: ${err}`
    }

    return [cryptoKey, err]
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
            name: keyPair.privateKey.algorithm.name,
            public: keyPair.publicKey,
        },
        keyPair.privateKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
    )
}
