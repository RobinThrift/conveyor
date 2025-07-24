import type { SettingsController } from "@/control/SettingsController"
import type { SetupController } from "@/control/SetupController"
import type { SyncController } from "@/control/SyncController"
import type { UnlockController } from "@/control/UnlockController"
import { DEFAULT_SETTINGS, type Settings } from "@/domain/Settings"
import type { SyncInfo } from "@/domain/SyncInfo"
import type { Context } from "@/lib/context"
import { type AsyncResult, Err, Ok } from "@/lib/result"
import { trace } from "@/lib/tracing"

import { init as initController } from "./controller"
import { init as initPlatform } from "./platform"

export async function init(ctx: Context) {
    let platform = await initPlatform()
    let controller = await initController(platform)

    let [autoUnlockResult, autoUnlockErr] = await trace(ctx, "AutoUnlock", (ctx) =>
        tryAutoUnlock(ctx, {
            unlockCtrl: controller.unlockCtrl,
            settingsCtrl: controller.settingsCtrl,
            setupCtrl: controller.setupCtrl,
            syncCtrl: controller.syncCtrl,
        }),
    )

    if (autoUnlockErr) {
        throw autoUnlockErr
    }

    return { controller, autoUnlockResult, fs: platform.fs, db: platform.db }
}

type AutoUnlockResult =
    | { isSetup: false }
    | {
          isSetup: true
          isUnlocked: boolean
          settings?: {
              values: Settings
          }
          sync?: SyncInfo
      }

export async function tryAutoUnlock(
    ctx: Context,
    {
        unlockCtrl,
        settingsCtrl,
        setupCtrl,
        syncCtrl,
    }: {
        unlockCtrl: UnlockController
        settingsCtrl: SettingsController
        setupCtrl: SetupController
        syncCtrl: SyncController
    },
): AsyncResult<AutoUnlockResult> {
    let [loadSetupInfo, loadSetupInfoErr] = await trace(ctx, "loadSetupInfo", (ctx) =>
        setupCtrl.loadSetupInfo(ctx),
    )

    if (loadSetupInfoErr) {
        return Err(loadSetupInfoErr)
    }

    if (!loadSetupInfo || !loadSetupInfo.isSetup) {
        return Ok({ isSetup: false })
    }

    let isUnlocked = false

    let [plaintextKeyData, plaintextKeyDataErr] = await trace(
        ctx,
        "tryGetPlaintextPrivateKey",
        (ctx) => unlockCtrl.tryGetPlaintextPrivateKey(ctx),
    )

    if (!plaintextKeyDataErr && plaintextKeyData) {
        let [_, unlockErr] = await trace(ctx, "unlock", (ctx) =>
            unlockCtrl.unlock(ctx, {
                plaintextKeyData: plaintextKeyData,
            }),
        )

        if (unlockErr) {
            throw unlockErr
        }

        isUnlocked = true
    }

    if (!isUnlocked) {
        return Ok({
            isSetup: true,
            isUnlocked: false,
            settings: { values: DEFAULT_SETTINGS },
        })
    }

    let [settings, loadSettingsErr] = await trace(ctx, "loadSettings", (ctx) =>
        settingsCtrl.loadSettings(ctx),
    )

    if (loadSettingsErr) {
        return Err(loadSettingsErr)
    }

    let [syncInfo, loadSyncInfoErr] = await trace(ctx, "loadSyncInfo", (ctx) => syncCtrl.load(ctx))
    if (loadSyncInfoErr) {
        return Err(loadSyncInfoErr)
    }

    return Ok({
        isSetup: true,
        isUnlocked,
        settings: { values: settings },
        sync: syncInfo,
    })
}
