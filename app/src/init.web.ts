import { setEnv } from "@/env"
import { IndexedDBKVStoreContainer } from "@/external/browser/IndexDBKVStore"
import { LocalStorageKVStoreContainer } from "@/external/browser/LocalStorageKVStore"
import { SessionStorageKVStoreContainer } from "@/external/browser/SessionStorageKVStore"
import { WebCryptoDeviceSecureStorage } from "@/external/browser/WebCryptoDeviceSecureStorage"
import { OPFS } from "@/external/browser/opfs"
import { SQLite } from "@/external/browser/sqlite"
import {
    type DeviceSecureStorage,
    NoopDeviceSecureStorage,
} from "@/lib/DeviceSecureStorage"
import { BaseContext } from "@/lib/context"
import { toPromise } from "@/lib/result"

import type {
    KVStores,
    PlatformDependencies,
    PlatformInitArgs,
} from "./init.platform"

export async function init({
    fs,
    db,
}: PlatformInitArgs): Promise<PlatformDependencies> {
    let [ctx, cancel] = BaseContext.withCancel()

    let sqlite = new SQLite(db)

    let deviceSecureStorage: DeviceSecureStorage =
        new WebCryptoDeviceSecureStorage()

    setEnv({
        platform: isStandalone() ? "pwa" : "web",
        lang: navigator.languages ? navigator.languages : [navigator.language],
        isDeviceSecureStorageAvailable: await deviceSecureStorage.isAvailable(),
    })

    let indexedDBKVStoreContainer = await toPromise(
        (IndexedDBKVStoreContainer<KVStores>).open(
            ctx,
            "conveyor",
            ["auth", "sync"],
            1,
        ),
    )

    window.addEventListener("unload", async () => {
        await sqlite.close()
        indexedDBKVStoreContainer.close()
    })

    let deviceSecureStorageInit = await deviceSecureStorage.init(ctx)
    if (!deviceSecureStorageInit.ok) {
        console.error(deviceSecureStorageInit.err)
        deviceSecureStorage = new NoopDeviceSecureStorage()
    }

    cancel()

    return {
        db: sqlite,
        fs: new OPFS(fs.baseDir, fs),
        kvContainers: {
            fast: new LocalStorageKVStoreContainer(),
            permanent: indexedDBKVStoreContainer,
            ephemeral: new SessionStorageKVStoreContainer(),
        },
        deviceSecureStorage,
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
