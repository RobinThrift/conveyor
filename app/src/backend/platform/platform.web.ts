import { setEnv } from "@/env"
import { AgeCrypto } from "@/external/age/AgeCrypto"
import { IndexedDBKVStoreContainer } from "@/external/browser/IndexDBKVStore"
import { WebCryptoDeviceSecureStorage } from "@/external/browser/WebCryptoDeviceSecureStorage"
import { OPFS } from "@/external/browser/opfs"
import { SQLite } from "@/external/browser/sqlite"
import { type DeviceSecureStorage, NoopDeviceSecureStorage } from "@/lib/DeviceSecureStorage"
import { BaseContext } from "@/lib/context"
import { RemoteNavigationBackend } from "@/lib/navigation"
import { toPromise } from "@/lib/result"

import type { KVStores, PlatformDependencies, PlatformInitArgs } from "./types"

export async function init({ fs, db }: PlatformInitArgs): Promise<PlatformDependencies> {
    let [ctx, cancel] = BaseContext.withCancel()

    let sqlite = new SQLite(db)

    let deviceSecureStorage: DeviceSecureStorage = new WebCryptoDeviceSecureStorage()

    let [_, deviceSecureStorageInitErr] = await deviceSecureStorage.init(ctx)
    if (deviceSecureStorageInitErr) {
        console.error(deviceSecureStorageInitErr)
        deviceSecureStorage = new NoopDeviceSecureStorage()
    }

    setEnv({
        platform: isStandalone() ? "pwa" : "web",
        lang: navigator.languages ? navigator.languages : [navigator.language],
        isDeviceSecureStorageAvailable: await deviceSecureStorage.isAvailable(),
    })

    let indexedDBKVStoreContainer = await toPromise(
        (IndexedDBKVStoreContainer<KVStores>).open(
            ctx,
            "conveyor",
            ["setup", "auth", "sync", "setup"],
            2,
        ),
    )

    cancel()

    return {
        db: sqlite,
        fs: new OPFS(fs.baseDir, fs),
        crypto: new AgeCrypto(),
        keyValueContainer: indexedDBKVStoreContainer,
        deviceSecureStorage,
        navigationBackend: new RemoteNavigationBackend(self.postMessage.bind(self)),
    }
}

function isStandalone() {
    if (!("standalone" in globalThis.navigator)) {
        return false
    }

    if (typeof globalThis.navigator.standalone === "undefined") {
        return false
    }

    return globalThis.navigator.standalone as boolean
}
