import type { CryptoController } from "@/control/CryptoController"
import { AgePrivateCryptoKey, type Identity } from "@/external/age/AgeCrypto"
import type { Context } from "@/lib/context"
import type { PlaintextPrivateKey } from "@/lib/crypto"
import type { Database } from "@/lib/database"
import { type AsyncResult, Ok, fromPromise } from "@/lib/result"

const _plaintextPrivateKeyStorageKey = "private-key"

export class UnlockController {
    private _storage: Storage
    private _crypto: CryptoController
    private _db: Database

    public isUnlocked = false

    constructor({
        storage,
        crypto,
        db,
    }: {
        storage: Storage
        crypto: CryptoController
        db: Database
    }) {
        this._storage = storage
        this._crypto = crypto
        this._db = db
    }

    public async reset(ctx: Context): AsyncResult<void> {
        this.isUnlocked = false
        return this._storage.removeItem(ctx, _plaintextPrivateKeyStorageKey)
    }

    public async tryGetPlaintextPrivateKey(
        ctx: Context,
    ): AsyncResult<PlaintextPrivateKey | undefined> {
        if (this.isUnlocked) {
            return Ok(undefined)
        }

        let key = await this._storage.getItem(
            ctx,
            _plaintextPrivateKeyStorageKey,
        )
        if (!key.ok) {
            return key
        }

        return Ok(key.value as PlaintextPrivateKey | undefined)
    }

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

        let privateKeyStr = await key.exportPrivateKey()
        if (!privateKeyStr.ok) {
            return privateKeyStr
        }

        let [initRes, openRes] = await Promise.all([
            this._crypto.init(ctx, { agePrivateCryptoKey: key }),
            fromPromise(
                this._db.open(ctx, {
                    enckey: privateKeyStr.value,
                    file: db?.file ?? "conveyor.db",
                    enableTracing: db?.enableTracing ?? false,
                }),
            ),
        ])
        if (!initRes.ok) {
            return initRes
        }

        if (!openRes.ok) {
            return openRes
        }

        this.isUnlocked = true

        if (storeKey) {
            return this._storage.setItem(
                ctx,
                _plaintextPrivateKeyStorageKey,
                plaintextKeyData,
            )
        }

        return Ok(undefined)
    }
}

export interface Storage {
    setItem(ctx: Context, key: string, value: string): AsyncResult<void>
    getItem(ctx: Context, key: string): AsyncResult<string | undefined>
    removeItem(ctx: Context, key: string): AsyncResult<void>
}
