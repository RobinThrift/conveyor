import * as age from "age-encryption"

import type {
    PlaintextPrivateKey,
    PrivateCryptoKey,
    PublicCryptoKey,
} from "@/lib/crypto"
import { type AsyncResult, Err, Ok, fromPromise, wrapErr } from "@/lib/result"

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

        let [receipientFromIdent, err] = await fromPromise(
            age.identityToRecipient(this.data),
        )
        if (err) {
            return wrapErr`error constructing recipient from identity: ${err}`
        }

        this._public = {
            type: this.type,
            data: receipientFromIdent as Recipient,
        }

        return Ok(this._public)
    }

    async exportPrivateKey() {
        return Ok(this.data as string as PlaintextPrivateKey)
    }

    async exportPublicKey(): AsyncResult<string> {
        let [publicKey, err] = await this.publicKey()
        if (err) {
            return wrapErr`error exporting public key: ${err}`
        }

        return Ok(publicKey.data as string)
    }

    static async generate(): AsyncResult<AgePrivateCryptoKey> {
        let [identity, err] = await fromPromise(age.generateIdentity())
        if (err) {
            return wrapErr`error generating key: ${err}`
        }

        return Ok(new AgePrivateCryptoKey(identity as Identity))
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
        let [publicKey, err] = await key.publicKey()
        if (err) {
            return Err(err)
        }
        this._encrypter.addRecipient(publicKey.data)
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

        let [encrypted, err] = await fromPromise(this._encrypter.encrypt(data))
        if (err) {
            return wrapErr`error encrypting data: ${err}`
        }

        return Ok(encrypted.buffer)
    }

    async decryptData(
        data: Uint8Array<ArrayBufferLike>,
    ): AsyncResult<ArrayBufferLike> {
        if (!this._initialised) {
            return Err(new Error("decryptData called before `init`"))
        }

        let [decryped, err] = await fromPromise(this._decrypter.decrypt(data))
        if (err) {
            return wrapErr`error decrypting data: ${err}`
        }

        return Ok(decryped.buffer)
    }

    async generatePrivateKey(): AsyncResult<AgePrivateCryptoKey> {
        return AgePrivateCryptoKey.generate()
    }
}
