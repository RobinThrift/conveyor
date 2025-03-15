import * as age from "age-encryption"

import type {
    PlaintextPrivateKey,
    PrivateCryptoKey,
    PublicCryptoKey,
} from "@/lib/crypto"
import { type AsyncResult, Err, Ok, fromPromise } from "@/lib/result"

export type Identity = string & { readonly "": unique symbol }
export type Recipient = string & { readonly "": unique symbol }

export class AgePrivateCryptoKey
    implements PrivateCryptoKey<Identity, Recipient>
{
    private _public?: PublicCryptoKey<Recipient>
    public type = "agev1"
    public data: Identity
    constructor(identity: Identity) {
        this.data = identity
    }

    async publicKey(): AsyncResult<PublicCryptoKey<Recipient>> {
        if (this._public) {
            return Ok(this._public)
        }

        let receipientFromIdent = await fromPromise(
            age.identityToRecipient(this.data),
        )
        if (!receipientFromIdent.ok) {
            return receipientFromIdent
        }

        this._public = {
            type: this.type,
            data: receipientFromIdent.value as Recipient,
        }

        return Ok(this._public)
    }

    async exportPrivateKey() {
        return Ok(this.data as string as PlaintextPrivateKey)
    }

    async exportPublicKey() {
        let publicKey = await this.publicKey()
        if (!publicKey.ok) {
            return publicKey
        }

        return Ok(publicKey.value.data as string)
    }

    static async generate(): AsyncResult<AgePrivateCryptoKey> {
        let identity = await fromPromise(age.generateIdentity())
        if (!identity.ok) {
            return identity
        }

        return Ok(new AgePrivateCryptoKey(identity.value as Identity))
    }
}

export class AgeCrypto {
    private _initialised = false
    private _encrypter: age.Encrypter
    private _decrypter: age.Decrypter

    constructor() {
        this._encrypter = new age.Encrypter()
        this._decrypter = new age.Decrypter()
    }

    async init(key: AgePrivateCryptoKey): AsyncResult<void> {
        let publicKey = await key.publicKey()
        if (!publicKey.ok) {
            return publicKey
        }
        this._encrypter.addRecipient(publicKey.value.data)
        this._decrypter.addIdentity(key.data)
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

    async generatePrivateKey(): AsyncResult<AgePrivateCryptoKey> {
        return AgePrivateCryptoKey.generate()
    }
}
