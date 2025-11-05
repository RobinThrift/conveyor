import { appConfigDir } from "@tauri-apps/api/path"
import { locale as loadLocale, platform } from "@tauri-apps/plugin-os"

import { setEnv } from "@/env"
import { AgeCrypto } from "@/external/age/AgeCrypto"
import { WebCryptoDeviceSecureStorage } from "@/external/browser/WebCryptoDeviceSecureStorage"
import { TauriFS } from "@/external/tauri/TauriFS"
import { TauriKVStoreContainer } from "@/external/tauri/TauriKVStore"
import { TauriSQLite } from "@/external/tauri/TauriSQLite"
import { BaseContext } from "@/lib/context"
import { type DeviceSecureStorage, NoopDeviceSecureStorage } from "@/lib/DeviceSecureStorage"

import type { PlatformDependencies, PlatformInitArgs } from "./types"

declare const __LOG_LEVEL__: string

export async function init({ fs }: PlatformInitArgs): Promise<PlatformDependencies> {
    let [ctx, cancel] = BaseContext.withCancel()

    let locale = await loadLocale()

    let deviceSecureStorage: DeviceSecureStorage = new WebCryptoDeviceSecureStorage()

    let [_, deviceSecureStorageInitErr] = await deviceSecureStorage.init(ctx)
    if (deviceSecureStorageInitErr) {
        console.error(deviceSecureStorageInitErr)
        deviceSecureStorage = new NoopDeviceSecureStorage()
    }

    setEnv({
        platform: platform() === "macos" ? "macos" : "tauri-generic",
        lang: locale ? [locale] : [],
        isDeviceSecureStorageAvailable: await deviceSecureStorage.isAvailable(),
    })

    if (__LOG_LEVEL__ === "debug") {
        console.debug("Tauri AppConfigDir: ", await appConfigDir())
    }

    let kvContainer = new TauriKVStoreContainer()

    cancel()

    return {
        db: new TauriSQLite(),
        fs: new TauriFS(fs.baseDir),
        crypto: new AgeCrypto(),
        keyValueContainer: kvContainer,
        deviceSecureStorage,
    }
}
