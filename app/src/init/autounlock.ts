import type { NavigationController } from "@/control/NavigationController"
import type { SettingsController } from "@/control/SettingsController"
import type { SetupController } from "@/control/SetupController"
import type { SyncController } from "@/control/SyncController"
import type { UnlockController } from "@/control/UnlockController"
import { DEFAULT_SETTINGS } from "@/domain/Settings"
import type { Context } from "@/lib/context"
import { type AsyncResult, Err, Ok, toPromise } from "@/lib/result"
import { trace } from "@/lib/tracing"
import { type RootStore, actions, selectors } from "@/ui/state"
import type { SettingsState } from "@/ui/state/settings/slice"
import type { SetupState } from "@/ui/state/setup/slice"
import type { SyncState } from "@/ui/state/sync/slice"
import type { UnlockState } from "@/ui/state/unlock/slice"

type AutoUnlockResult = {
    setup: SetupState
    unlock: UnlockState
    settings: SettingsState
    sync: SyncState
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
): AsyncResult<AutoUnlockResult | undefined> {
    let [loadSetupInfo, loadSetupInfoErr] = await trace(
        ctx,
        "loadSetupInfo",
        (ctx) => setupCtrl.loadSetupInfo(ctx),
    )

    if (loadSetupInfoErr) {
        return Err(loadSetupInfoErr)
    }

    if (!loadSetupInfo || !loadSetupInfo.isSetup) {
        return Ok(undefined)
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
            setup: {
                isSetup: true,
                step: "done",
                selectedOptions: {
                    isNew: false,
                    syncMethod: "local-only",
                },
            },

            unlock: {
                state: "locked",
            },

            settings: {
                isLoading: false,
                isLoaded: false,
                values: DEFAULT_SETTINGS,
            },

            sync: {
                status: "disabled",
                info: { isEnabled: false },
                isSyncRequested: false,
            },
        })
    }

    let [settings, loadSettingsErr] = await trace(ctx, "loadSettings", (ctx) =>
        settingsCtrl.loadSettings(ctx),
    )

    if (loadSettingsErr) {
        return Err(loadSettingsErr)
    }

    let [syncInfo, loadSyncInfoErr] = await trace(ctx, "loadSyncInfo", (ctx) =>
        syncCtrl.load(ctx),
    )

    if (loadSyncInfoErr) {
        return Err(loadSyncInfoErr)
    }

    return Ok({
        setup: {
            isSetup: true,
            step: "done",
            selectedOptions: {
                isNew: false,
                syncMethod: syncInfo?.isEnabled ? "remote-sync" : "local-only",
            },
        },

        unlock: {
            state: isUnlocked ? "unlocked" : "locked",
        },

        settings: {
            isLoading: false,
            isLoaded: true,
            values: settings,
        },

        sync: syncInfo?.isEnabled
            ? {
                  status: "ready",
                  isSyncRequested: false,
                  info: syncInfo,
              }
            : {
                  status: "disabled",
                  info: { isEnabled: false },
                  isSyncRequested: false,
              },
    })
}

export async function __tryAutoUnlock(
    ctx: Context,
    {
        rootStore,
        unlockCtrl,
        navCtrl,
    }: {
        rootStore: RootStore
        unlockCtrl: UnlockController
        navCtrl: NavigationController
    },
) {
    let tryUnlock = Promise.withResolvers<void>()

    let autoUnlock = await toPromise(unlockCtrl.tryGetPlaintextPrivateKey(ctx))
    if (autoUnlock) {
        rootStore.dispatch(
            actions.unlock.unlock({
                plaintextKeyData: autoUnlock,
            }),
        )
    } else {
        rootStore.dispatch(actions.setup.loadSetupInfo())
        rootStore.dispatch(actions.sync.loadSyncInfo())
    }

    let unsub = rootStore.subscribe(() => {
        let state = rootStore.getState()

        if (selectors.unlock.isUnlocked(state)) {
            unsub()
            tryUnlock.resolve()
            return
        }

        if (state.setup.isSetup) {
            unsub()
            navCtrl.push({
                screen: { name: "unlock", params: {} },
                restore: { scrollOffsetTop: 0 },
            })
            tryUnlock.resolve()
            return
        }

        if (state.setup.step === "initial-setup") {
            unsub()
            navCtrl.push({
                screen: { name: "setup", params: {} },
                restore: { scrollOffsetTop: 0 },
            })
            tryUnlock.resolve()
        }
    })

    return tryUnlock.promise
}
