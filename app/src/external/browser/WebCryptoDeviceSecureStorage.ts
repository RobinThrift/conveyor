import { newID } from "@/domain/ID"
import type { Context } from "@/lib/context"
import type { DeviceSecureStorage } from "@/lib/DeviceSecureStorage"
import type { AsyncResult } from "@/lib/result"
import { WebCryptoDeviceSecureStorageWorker } from "./WebCryptoDeviceSecureStorageWorker"

export class WebCryptoDeviceSecureStorage implements DeviceSecureStorage {
    private _worker: ReturnType<typeof WebCryptoDeviceSecureStorageWorker.createClient>

    constructor() {
        this._worker = WebCryptoDeviceSecureStorageWorker.createClient(
            new Worker(
                new URL("./WebCryptoDeviceSecureStorage.worker?worker&url", import.meta.url),
                {
                    type: "module",
                    name: `WebCryptoDeviceSecureStorageWorker-${newID()}`,
                },
            ),
        )
    }

    public async isAvailable(): Promise<boolean> {
        return "generateKey" in globalThis.crypto.subtle
    }

    public async init(ctx: Context): AsyncResult<void> {
        return this._worker.init(ctx)
    }

    public async reset(ctx: Context): AsyncResult<void> {
        return this._worker.reset(ctx)
    }

    public async getItem(ctx: Context, key: string): AsyncResult<string | undefined> {
        return this._worker.getItem(ctx, { key })
    }

    public async setItem(ctx: Context, key: string, value: string): AsyncResult<void> {
        return this._worker.setItem(ctx, { key, value })
    }

    public async removeItem(ctx: Context, key: string): AsyncResult<void> {
        return this._worker.removeItem(ctx, { key })
    }
}
