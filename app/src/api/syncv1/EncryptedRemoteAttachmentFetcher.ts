import type { Context } from "@/lib/context"
import type { Decrypter } from "@/lib/crypto"
import { type AsyncResult, Err } from "@/lib/result"

import type { SyncV1APIClient } from "./SyncV1APIClient"

export class EncryptedRemoteAttachmentFetcher {
    private _syncAPIClient: SyncV1APIClient
    private _decrypter: Decrypter

    constructor({
        syncAPIClient,
        decrypter,
    }: {
        syncAPIClient: SyncV1APIClient
        decrypter: Decrypter
    }) {
        this._syncAPIClient = syncAPIClient
        this._decrypter = decrypter
    }

    public async getAttachmentDataByFilepath(
        ctx: Context,
        filepath: string,
    ): AsyncResult<ArrayBufferLike> {
        let [data, err] = await this._syncAPIClient.getAttachmentDataByFilepath(ctx, filepath)
        if (err) {
            return Err(err)
        }

        return this._decrypter.decryptData(new Uint8Array(data))
    }
}
