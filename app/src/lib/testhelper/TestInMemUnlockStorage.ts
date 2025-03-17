import type { Context } from "@/lib/context"
import type { PlaintextPrivateKey } from "@/lib/crypto"
import { type AsyncResult, Ok } from "@/lib/result"

export class TestInMemUnlockStorage {
    async getPlaintextPrivateKey(
        _: Context,
    ): AsyncResult<PlaintextPrivateKey | undefined> {
        return Ok(undefined)
    }

    async storePlaintextPrivateKey(
        _ctx: Context,
        _key: PlaintextPrivateKey,
    ): AsyncResult<void> {
        return Ok(undefined)
    }

    async removePlaintextPrivateKey(_: Context): AsyncResult<void> {
        return Ok(undefined)
    }
}
