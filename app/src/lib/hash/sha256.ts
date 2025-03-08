import type { AsyncResult } from "@/lib/result"

export interface Sha256Hasher {
    sum(data: BufferSource): AsyncResult<ArrayBufferLike>
}
