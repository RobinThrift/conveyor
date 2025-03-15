import { AgePrivateCryptoKey, type Identity } from "@/external/age/AgeCrypto"
import type { Context } from "@/lib/context"
import type { Crypto, PlaintextPrivateKey } from "@/lib/crypto"
import type { Database } from "@/lib/database"
import { type AsyncResult, Ok, fromPromise } from "@/lib/result"

export class UnlockController {
    private _crypto: Crypto
    private _db: Database

    public isUnlocked = false

    constructor({
        crypto,
        db,
    }: {
        crypto: Crypto
        db: Database
    }) {
        this._crypto = crypto
        this._db = db
    }

    public async unlock(
        ctx: Context,
        {
            plaintextKeyData,
            db,
        }: {
            plaintextKeyData: PlaintextPrivateKey
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
            this._crypto.init(key),
            fromPromise(
                this._db.open(ctx, {
                    enckey: privateKeyStr.value,
                    file: db?.file ?? "belt.db",
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

        return Ok(undefined)
    }
}
