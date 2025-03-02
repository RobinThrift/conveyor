import { type AsyncResult, fromPromise } from "@/lib/result"

import * as webcrypto from "@/external/browser/crypto"

type KeyType = "private" | "public" | "secret"
type KeyUsage =
    | "decrypt"
    | "deriveBits"
    | "deriveKey"
    | "encrypt"
    | "sign"
    | "unwrapKey"
    | "verify"
    | "wrapKey"

export interface CryptoKey {
    readonly algorithm: {
        name: "PBKDF2"
    }
    readonly type: KeyType
    readonly usages: KeyUsage[]
}

export async function createKeyFromPassword(
    passwd: string,
): AsyncResult<CryptoKey> {
    return fromPromise(
        webcrypto.createKeyFromPassword(passwd),
    ) as AsyncResult<CryptoKey>
}

export async function calcSha256Hash(
    data: BufferSource,
): AsyncResult<ArrayBuffer> {
    return fromPromise(webcrypto.calcSha256Hash(data))
}

export async function encryptData(
    base: CryptoKey,
    data: Uint8Array,
): AsyncResult<ArrayBufferLike> {
    return fromPromise(webcrypto.encryptData(base as webcrypto.CryptoKey, data))
}

export async function decryptData(
    base: CryptoKey,
    data: Uint8Array,
): AsyncResult<ArrayBufferLike> {
    return fromPromise(webcrypto.decryptData(base as webcrypto.CryptoKey, data))
}
