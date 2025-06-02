import type { CryptoController } from "@/control/CryptoController"
import { AgePrivateCryptoKey, type Identity } from "@/external/age/AgeCrypto"
import type { Context } from "@/lib/context"
import type { PlaintextPrivateKey } from "@/lib/crypto"
import type { Database } from "@/lib/database"
import { createErrType } from "@/lib/errors"
import { type AsyncResult, Ok, fromPromise, wrapErr } from "@/lib/result"

const _plaintextPrivateKeyStorageKey = "private-key"

export class UnlockController {
    private _storage?: Storage
    private _crypto: CryptoController
    private _db: Database

    public isUnlocked = false

    constructor({
        storage,
        crypto,
        db,
    }: {
        storage?: Storage
        crypto: CryptoController
        db: Database
    }) {
        this._storage = storage
        this._crypto = crypto
        this._db = db
    }

    public async reset(ctx: Context): AsyncResult<void> {
        this.isUnlocked = false
        return (
            this._storage?.removeItem(ctx, _plaintextPrivateKeyStorageKey) ??
            Ok(undefined)
        )
    }

    public static ErrTryGetPlaintextPrivateKey = createErrType(
        "UnlockController",
        "error tryuing to get plaintext private key",
    )
    public async tryGetPlaintextPrivateKey(
        ctx: Context,
    ): AsyncResult<PlaintextPrivateKey | undefined> {
        if (this.isUnlocked) {
            return Ok(undefined)
        }

        if (!this._storage) {
            return Ok(undefined)
        }

        let [key, err] = await this._storage.getItem(
            ctx,
            _plaintextPrivateKeyStorageKey,
        )
        if (err) {
            return wrapErr`${new UnlockController.ErrTryGetPlaintextPrivateKey()}: ${err}`
        }

        return Ok(key as PlaintextPrivateKey | undefined)
    }

    public static ErrUnlock = createErrType(
        "UnlockController",
        "error unlocking",
    )
    public async unlock(
        ctx: Context,
        {
            plaintextKeyData,
            storeKey,
            db,
        }: {
            plaintextKeyData: PlaintextPrivateKey
            storeKey?: boolean
            db?: {
                file?: string
                enableTracing?: boolean
            }
        },
    ): AsyncResult<void> {
        if (this.isUnlocked) {
            return Ok(undefined)
        }

        let key = new AgePrivateCryptoKey(
            plaintextKeyData as string as Identity,
        )

        let [privateKeyStr, privateKeyErr] = await key.exportPrivateKey()
        if (privateKeyErr) {
            return wrapErr`${new UnlockController.ErrUnlock()}: ${privateKeyErr}`
        }

        let [[_cryptoInit, cryptoInitErr], [_dbOpen, dbOpenErr]] =
            await Promise.all([
                this._crypto.init(ctx, { agePrivateCryptoKey: key }),
                fromPromise(
                    this._db.open(ctx, {
                        enckey: privateKeyStr,
                        file: db?.file ?? "conveyor.db",
                        enableTracing: db?.enableTracing ?? false,
                    }),
                ),
            ])
        if (cryptoInitErr) {
            return wrapErr`${new UnlockController.ErrUnlock()}: error initializing crypto provider: ${cryptoInitErr}`
        }

        if (dbOpenErr) {
            return wrapErr`${new UnlockController.ErrUnlock()}: error opening database: ${dbOpenErr}`
        }

        this.isUnlocked = true

        if (storeKey && this._storage) {
            return this._storage.setItem(
                ctx,
                _plaintextPrivateKeyStorageKey,
                plaintextKeyData,
            )
        }

        return Ok()
    }
}

export interface Storage {
    setItem(ctx: Context, key: string, value: string): AsyncResult<void>
    getItem(ctx: Context, key: string): AsyncResult<string | undefined>
    removeItem(ctx: Context, key: string): AsyncResult<void>
}
