import type { Context } from "@/lib/context"
import { type AsyncResult, Err } from "@/lib/result"

/**
 * A DeviceSecureStorage is a secure storage container for a specific device that may or may not
 * be synchronised. It should only be used for sensitive but ultimately ephemeral data.
 */
export interface DeviceSecureStorage {
    isAvailable(): Promise<boolean>
    init(ctx: Context): AsyncResult<void>
    reset(ctx: Context): AsyncResult<void>
    getItem(ctx: Context, key: string): AsyncResult<string | undefined>
    setItem(ctx: Context, key: string, value: string): AsyncResult<void>
    removeItem(ctx: Context, key: string): AsyncResult<void>
}

const NoopDeviceSecureStorageError = new Error(
    "no device secure storage available",
)

export class NoopDeviceSecureStorage implements DeviceSecureStorage {
    public async isAvailable(): Promise<boolean> {
        return false
    }

    public async init(_ctx: Context): AsyncResult<void> {
        return Err(NoopDeviceSecureStorageError)
    }

    public async reset(_ctx: Context): AsyncResult<void> {
        return Err(NoopDeviceSecureStorageError)
    }

    public async getItem(_ctx: Context, _key: string): AsyncResult<string> {
        return Err(NoopDeviceSecureStorageError)
    }

    public async setItem(
        _ctx: Context,
        _key: string,
        _value: string,
    ): AsyncResult<void> {
        return Err(NoopDeviceSecureStorageError)
    }

    public async removeItem(_ctx: Context, _key: string): AsyncResult<void> {
        return Err(NoopDeviceSecureStorageError)
    }
}
