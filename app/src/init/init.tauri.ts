import { appConfigDir } from "@tauri-apps/api/path"
import { locale as loadLocale, platform } from "@tauri-apps/plugin-os"

import { setEnv } from "@/env"
import { SessionStorageKVStoreContainer } from "@/external/browser/SessionStorageKVStore"
import { WebCryptoDeviceSecureStorage } from "@/external/browser/WebCryptoDeviceSecureStorage"
import { TauriFS } from "@/external/tauri/TauriFS"
import { TauriKVStoreContainer } from "@/external/tauri/TauriKVStore"
import { TauriSQLite } from "@/external/tauri/TauriSQLite"
import {
    type DeviceSecureStorage,
    NoopDeviceSecureStorage,
} from "@/lib/DeviceSecureStorage"
import { BaseContext } from "@/lib/context"

import type { PlatformDependencies, PlatformInitArgs } from "./platform"

export async function init({
    fs,
}: PlatformInitArgs): Promise<PlatformDependencies> {
    let [ctx, cancel] = BaseContext.withCancel()

    let locale = await loadLocale()

    let deviceSecureStorage: DeviceSecureStorage =
        new WebCryptoDeviceSecureStorage()

    let deviceSecureStorageInit = await deviceSecureStorage.init(ctx)
    if (!deviceSecureStorageInit.ok) {
        console.error(deviceSecureStorageInit.err)
        deviceSecureStorage = new NoopDeviceSecureStorage()
    }

    setEnv({
        platform: platform() === "macos" ? "macos" : "tauri-generic",
        lang: locale ? [locale] : [],
        isDeviceSecureStorageAvailable: await deviceSecureStorage.isAvailable(),
    })

    // biome-ignore lint/nursery/noProcessEnv: only used for development
    if (process.env.NODE_ENV === "development") {
        console.log("Tauri AppConfigDir: ", await appConfigDir())
    }

    let kvContainer = new TauriKVStoreContainer()

    cancel()

    return {
        db: new TauriSQLite(),
        fs: new TauriFS(fs.baseDir),
        kvContainers: {
            fast: kvContainer,
            permanent: kvContainer,
            ephemeral: new SessionStorageKVStoreContainer(),
        },
        deviceSecureStorage,
    }
}
