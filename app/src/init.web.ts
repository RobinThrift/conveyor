import { setEnv } from "@/env"
import { IndexedDBKVStoreContainer } from "@/external/browser/IndexDBKVStore"
import { LocalStorageKVStoreContainer } from "@/external/browser/LocalStorageKVStore"
import { SessionStorageKVStoreContainer } from "@/external/browser/SessionStorageKVStore"
import { OPFS } from "@/external/browser/opfs"
import { SQLite } from "@/external/browser/sqlite"
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

    setEnv({
        platform: "web",
        lang: navigator.languages ? navigator.languages : [navigator.language],
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

    cancel()

    return {
        db: sqlite,
        fs: new OPFS(fs.baseDir, fs),
        kvContainers: {
            fast: new LocalStorageKVStoreContainer(),
            permanent: indexedDBKVStoreContainer,
            ephemeral: new SessionStorageKVStoreContainer(),
        },
    }
}
