import type { Context } from "@/lib/context"
import type { PlaintextPrivateKey } from "@/lib/crypto"
import { type AsyncResult, Ok } from "@/lib/result"

export class SessionStorageUnlockStorage {
    private _plaintextPrivateKeyStorageKey = "conveyor.private-key"

    async getPlaintextPrivateKey(
        _: Context,
    ): AsyncResult<PlaintextPrivateKey | undefined> {
        let key = globalThis.sessionStorage.getItem(
            this._plaintextPrivateKeyStorageKey,
        )
        if (!key) {
            return Ok(undefined)
        }

        return Ok(key as PlaintextPrivateKey)
    }

    async storePlaintextPrivateKey(
        _: Context,
        key: PlaintextPrivateKey,
    ): AsyncResult<void> {
        return Ok(
            globalThis.sessionStorage.setItem(
                this._plaintextPrivateKeyStorageKey,
                key,
            ),
        )
    }

    async removePlaintextPrivateKey(_: Context): AsyncResult<void> {
        return Ok(
            globalThis.sessionStorage.removeItem(
                this._plaintextPrivateKeyStorageKey,
            ),
        )
    }
}
