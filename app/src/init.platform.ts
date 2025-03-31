import type { Context } from "@/lib/context"
import type { Database } from "@/lib/database"
import type { FS } from "@/lib/fs"

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

export interface PlatformDependencies {
    db: Database
    fs: FS
}

export type InitPlatform = (
    args: PlatformInitArgs,
) => Promise<PlatformDependencies>
