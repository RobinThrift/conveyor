import type { Sha256Hasher } from "@/lib/hash"
import { type AsyncResult, fromPromise } from "@/lib/result"

export class WebCryptoSha256Hasher implements Sha256Hasher {
    sum(data: BufferSource): AsyncResult<ArrayBufferLike> {
        return fromPromise(globalThis.crypto.subtle.digest("SHA-256", data))
    }
}
