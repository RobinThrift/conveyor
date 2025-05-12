import { awaitWithAbort } from "@/lib/awaitWithAbort"
import { BaseContext, type Context } from "@/lib/context"
import { Second } from "@/lib/duration"
import { type AsyncResult, Err, Ok, fmtErr, fromPromise } from "@/lib/result"
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
        let cryptoKey = await db.get(ctx, "keys", LOCAL_KEY_V1_NAME)
        if (!cryptoKey.ok) {
            return cryptoKey
        }

        if (cryptoKey.value) {
            localCryptoKey.resolve(cryptoKey.value.key)
            return Ok(undefined)
        }

        let generatedKey = await generateLocalCryptoKey()
        if (!generatedKey.ok) {
            return generatedKey
        }

        let inserted = await db.insertOrUpdate(ctx, "keys", [
            { name: LOCAL_KEY_V1_NAME, key: generatedKey.value },
        ])

        if (!inserted.ok) {
            if (
                inserted.err.name === "DataError" ||
                (inserted.err.cause as Error)?.name === "DataErro"
            ) {
                generatedKey = await generateECDHLocalCryptoKey()
                if (!generatedKey.ok) {
                    return generatedKey
                }
                inserted = await db.insertOrUpdate(ctx, "keys", [
                    { name: LOCAL_KEY_V1_NAME, key: generatedKey.value },
                ])
            }
        }

        if (!inserted.ok) {
            localCryptoKey.reject(inserted.err)
            return inserted
        }

        localCryptoKey.resolve(generatedKey.value)

        return Ok(undefined)
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
            return fmtErr("error decrypting data: %w", plaintext)
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
            return fmtErr("error encrypting data: %w", ciphertext)
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

async function generateLocalCryptoKey() {
    let cryptoKey = await generateX25519LocalCryptoKey()

    if (!cryptoKey.ok) {
        if (
            cryptoKey.err.name === "NotSupportedError" ||
            (cryptoKey.err.cause as Error)?.name === "NotSupportedError"
        ) {
            cryptoKey = await generateECDHLocalCryptoKey()
        }
    }

    return cryptoKey
}

async function generateX25519LocalCryptoKey(): AsyncResult<CryptoKeyPair> {
    let cryptoKey = await fromPromise(
        globalThis.crypto.subtle.generateKey({ name: "X25519" }, false, [
            "deriveKey",
        ]) as Promise<CryptoKeyPair>,
    )

    if (!cryptoKey.ok) {
        return Err(
            Error(`error generating X25519 key: ${cryptoKey.err}}`, {
                cause: cryptoKey.err,
            }),
        )
    }

    return cryptoKey
}

async function generateECDHLocalCryptoKey(): AsyncResult<CryptoKeyPair> {
    let cryptoKey = await fromPromise(
        globalThis.crypto.subtle.generateKey(
            { name: "ECDH", namedCurve: "P-384" },
            false,
            ["deriveKey"],
        ) as Promise<CryptoKeyPair>,
    )

    if (!cryptoKey.ok) {
        return Err(
            new Error(
                `error generating ECDH key using P-384: ${cryptoKey.err}}`,
                {
                    cause: cryptoKey.err,
                },
            ),
        )
    }

    return cryptoKey
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
