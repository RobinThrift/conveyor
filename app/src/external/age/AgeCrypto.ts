import * as age from "age-encryption"

import { type AsyncResult, Err, Ok, fromPromise } from "@/lib/result"
import type { SenstiveValue } from "@/lib/sensitive"

export class AgeCrypto {
    private _initialised = false
    private _encrypter: age.Encrypter
    private _decrypter: age.Decrypter

    constructor() {
        this._encrypter = new age.Encrypter()
        this._decrypter = new age.Decrypter()
    }

    async init(password: SenstiveValue): AsyncResult<void> {
        this._encrypter.setPassphrase(password)
        this._decrypter.addPassphrase(password)
        this._initialised = true
        return Ok(undefined)
    }

    async encryptData(
        data: Uint8Array<ArrayBufferLike>,
    ): AsyncResult<ArrayBufferLike> {
        if (!this._initialised) {
            return Err(new Error("encryptData called before `init`"))
        }

        let encrypted = await fromPromise(this._encrypter.encrypt(data))
        if (!encrypted.ok) {
            return encrypted
        }

        return Ok(encrypted.value.buffer)
    }

    async decryptData(
        data: Uint8Array<ArrayBufferLike>,
    ): AsyncResult<ArrayBufferLike> {
        if (!this._initialised) {
            return Err(new Error("decryptData called before `init`"))
        }

        let decryped = await fromPromise(this._decrypter.decrypt(data))
        if (!decryped.ok) {
            return decryped
        }

        return Ok(decryped.value.buffer)
    }
}
