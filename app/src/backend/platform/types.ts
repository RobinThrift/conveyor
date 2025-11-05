import type { Context } from "@/lib/context"
import type { Crypto } from "@/lib/crypto"
import type { DeviceSecureStorage } from "@/lib/DeviceSecureStorage"
import type { Database } from "@/lib/database"
import type { FS } from "@/lib/fs"
import type { KVStoreContainer } from "@/lib/KVStore"

export interface PlatformInitArgs {
    db: {
        baseCtx?: Context
        onError?: (err: Error) => void
    }
    fs: {
        baseDir: string
        onError?: (err: Error) => void
    }
}

export type KVStores = "auth" | "sync" | "setup" | "ui"

export interface PlatformDependencies {
    db: Database
    fs: FS
    crypto: Crypto
    keyValueContainer: KVStoreContainer<KVStores>
    deviceSecureStorage: DeviceSecureStorage
}

export type InitPlatform = (args: PlatformInitArgs) => Promise<PlatformDependencies>
