import type { Restore, Screens, Stacks } from "@/control/NavigationController"
import type { DeviceSecureStorage } from "@/lib/DeviceSecureStorage"
import type { KVStoreContainer } from "@/lib/KVStore"
import type { Context } from "@/lib/context"
import type { Crypto } from "@/lib/crypto"
import type { Database } from "@/lib/database"
import type { FS } from "@/lib/fs"
import type { NavigationBackend } from "@/lib/navigation"

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

export type KVStores = "auth" | "sync" | "setup"

export interface PlatformDependencies {
    db: Database
    fs: FS
    crypto: Crypto
    keyValueContainer: KVStoreContainer<KVStores>
    deviceSecureStorage: DeviceSecureStorage
    navigationBackend: NavigationBackend<Screens, Stacks, Restore>
}

export type InitPlatform = (args: PlatformInitArgs) => Promise<PlatformDependencies>
