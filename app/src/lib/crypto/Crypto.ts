import type { AsyncResult } from "@/lib/result"
import type { SenstiveValue } from "@/lib/sensitive"

export interface Encrypter {
    encryptData(data: Uint8Array<ArrayBufferLike>): AsyncResult<ArrayBufferLike>
}

export interface Decrypter {
    decryptData(data: Uint8Array<ArrayBufferLike>): AsyncResult<ArrayBufferLike>
}

export interface Crypto extends Encrypter, Decrypter {
    init(password: SenstiveValue): AsyncResult<void>
}
