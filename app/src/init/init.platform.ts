import type { KVStoreContainer } from "@/lib/KVStore"
import type { Context } from "@/lib/context"
import type { Database } from "@/lib/database"
import type { FS } from "@/lib/fs"
import type { DeviceSecureStorage } from "../lib/DeviceSecureStorage"

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

export type KVStores = "auth" | "sync" | "setup" | "unlock"

export interface PlatformDependencies {
    db: Database
    fs: FS
    kvContainers: {
        fast: KVStoreContainer<KVStores>
        permanent: KVStoreContainer<KVStores>
        ephemeral: KVStoreContainer<KVStores>
    }
    deviceSecureStorage: DeviceSecureStorage
}

export type InitPlatform = (args: PlatformInitArgs) => Promise<PlatformDependencies>
