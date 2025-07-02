import { AgeV1AccountKeyType } from "@/domain/AccountKey"
import { AgePrivateCryptoKey, type Identity } from "@/external/age/AgeCrypto"
import type { Context } from "@/lib/context"
import type { Crypto, PlaintextPrivateKey, PublicCryptoKey } from "@/lib/crypto"
import { type AsyncResult, Err, Ok, type Result, wrapErr } from "@/lib/result"

export class CryptoController {
    private _crypto: Crypto
    public publicKey: Result<PublicCryptoKey<string>> = Err(new Error("crypto not setup yet"))

    constructor({
        crypto,
    }: {
        crypto: Crypto
    }) {
        this._crypto = crypto
    }

    public async init(
        _: Context,
        { agePrivateCryptoKey }: { agePrivateCryptoKey: AgePrivateCryptoKey },
    ): AsyncResult<void>
    public async init(
        _: Context,
        { plaintextKeyData }: { plaintextKeyData: PlaintextPrivateKey },
    ): AsyncResult<void>
    public async init(
        _: Context,
        args:
            | { plaintextKeyData: PlaintextPrivateKey }
            | { agePrivateCryptoKey: AgePrivateCryptoKey },
    ): AsyncResult<void> {
        let key: AgePrivateCryptoKey
        if ("plaintextKeyData" in args) {
            key = new AgePrivateCryptoKey(args.plaintextKeyData as string as Identity)
        } else {
            key = args.agePrivateCryptoKey
        }

        let [_privateKeyStr, privateKeyStrErr] = await key.exportPrivateKey()
        if (privateKeyStrErr) {
            return wrapErr`error getting private key: ${privateKeyStrErr}`
        }

        let [publicKey, publicKeyErr] = await key.exportPublicKey()
        if (publicKeyErr) {
            return wrapErr`error getting public key: ${publicKeyErr}`
        }

        this.publicKey = Ok({
            type: AgeV1AccountKeyType,
            data: publicKey,
        })

        let [_init, initErr] = await this._crypto.init(key)
        if (initErr) {
            return wrapErr`error initializing crypto provider: ${initErr}`
        }

        return Ok(undefined)
    }

    public async encryptData(data: Uint8Array<ArrayBufferLike>): AsyncResult<ArrayBufferLike> {
        return this._crypto.encryptData(data)
    }

    public async decryptData(data: Uint8Array<ArrayBufferLike>): AsyncResult<ArrayBufferLike> {
        return this._crypto.decryptData(data)
    }
}
