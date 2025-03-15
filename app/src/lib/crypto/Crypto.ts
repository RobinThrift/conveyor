import type { AsyncResult } from "@/lib/result"

export interface Encrypter {
    encryptData(data: Uint8Array<ArrayBufferLike>): AsyncResult<ArrayBufferLike>
}

export interface Decrypter {
    decryptData(data: Uint8Array<ArrayBufferLike>): AsyncResult<ArrayBufferLike>
}

export type PlaintextPrivateKey = string & { readonly "": unique symbol }

export interface PrivateCryptoKey<Private = unknown, Public = Private> {
    type: string
    data: Private
    publicKey(): AsyncResult<PublicCryptoKey<Public>>

    exportPrivateKey(): AsyncResult<PlaintextPrivateKey>
    exportPublicKey(): AsyncResult<string>
}

export interface PublicCryptoKey<D = unknown> {
    type: string
    data: D
}

export interface Crypto extends Encrypter, Decrypter {
    init(key: PrivateCryptoKey): AsyncResult<void>
}
