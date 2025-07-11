import type { APITokenController } from "@/control/APITokenController"
import type { AttachmentController } from "@/control/AttachmentController"
import type { AuthController } from "@/control/AuthController"
import type { ChangelogController } from "@/control/ChangelogController"
import type { MemoController } from "@/control/MemoController"
import type { NavigationController } from "@/control/NavigationController"
import type { SettingsController } from "@/control/SettingsController"
import type { SetupController } from "@/control/SetupController"
import type { SyncController } from "@/control/SyncController"
import type { UnlockController } from "@/control/UnlockController"
import type { Database } from "@/lib/database"
import type { FS } from "@/lib/fs"
import { configureEffects, configureRootStore } from "@/ui/state"
import { runStoreInWorker } from "@/ui/state/worker"

export function initRootStore(
    initState: any,
    controller: {
        memoCtrl: MemoController
        attachmentCtrl: AttachmentController
        settingsCtrl: SettingsController
        syncCtrl: SyncController
        authCtrl: AuthController
        setupCtrl: SetupController
        unlockCtrl: UnlockController
        apiTokenCtrl: APITokenController
        navCtrl: NavigationController
        changelogCtrl: ChangelogController
        db: Database
        fs: FS
    },
) {
    let rootStore = configureRootStore(initState)

    configureEffects(rootStore, controller)

    runStoreInWorker(rootStore)

    return rootStore
}
