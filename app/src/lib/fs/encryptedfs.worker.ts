import type { Context } from "@/lib/context"
import { type CryptoKey, decryptData, encryptData } from "@/lib/crypto"
import type { AsyncResult } from "@/lib/result"
import { createWorker } from "@/lib/worker"

export const EncryptedFSWorker = createWorker({
    read: async (
        _: Context,
        { data, enckey }: { data: ArrayBufferLike; enckey: CryptoKey },
    ): AsyncResult<ArrayBufferLike> => {
        let buf = new Uint8Array(data)
        if (data instanceof SharedArrayBuffer) {
            buf = new Uint8Array(data.byteLength)
            buf.set(new Uint8Array(data), 0)
        }

        let decrypted = await decryptData(enckey, buf)

        return decrypted
    },

    write: async (
        _: Context,
        { data, enckey }: { data: ArrayBufferLike; enckey: CryptoKey },
    ): AsyncResult<ArrayBufferLike> => {
        let buf = new Uint8Array(data)
        if (data instanceof SharedArrayBuffer) {
            buf = new Uint8Array(data.byteLength)
            buf.set(new Uint8Array(data), 0)
        }

        let encrypted = await encryptData(enckey, buf)

        return encrypted
    },
})

EncryptedFSWorker.runIfWorker()
