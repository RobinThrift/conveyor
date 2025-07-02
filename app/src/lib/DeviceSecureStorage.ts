import type { Context } from "@/lib/context"
import { type AsyncResult, Err } from "@/lib/result"
import type { ErrorCode } from "./errors"

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

export class NoopDeviceSecureStorageError extends Error {
    static ERR_CODE = "NOOP_DEVICE_SECURE_STORAGE_ERROR" as ErrorCode
    constructor(additionalInfo?: string, options?: ErrorOptions) {
        let msg = "no device secure storage available"
        if (additionalInfo) {
            msg = `${msg}: ${additionalInfo}`
        }
        super(`[${NoopDeviceSecureStorageError.ERR_CODE}] ${msg}`, options)
    }
}

export class NoopDeviceSecureStorage implements DeviceSecureStorage {
    public async isAvailable(): Promise<boolean> {
        return false
    }

    public async init(_ctx: Context): AsyncResult<void> {
        return Err(new NoopDeviceSecureStorageError("init"))
    }

    public async reset(_ctx: Context): AsyncResult<void> {
        return Err(new NoopDeviceSecureStorageError("reset"))
    }

    public async getItem(_ctx: Context, key: string): AsyncResult<string> {
        return Err(new NoopDeviceSecureStorageError(`getItem: ${key}`))
    }

    public async setItem(_ctx: Context, key: string, _value: string): AsyncResult<void> {
        return Err(new NoopDeviceSecureStorageError(`setItem: ${key}`))
    }

    public async removeItem(_ctx: Context, key: string): AsyncResult<void> {
        return Err(new NoopDeviceSecureStorageError(`removeItem: ${key}`))
    }
}
