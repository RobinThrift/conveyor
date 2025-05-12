import type { NavigationController } from "@/control/NavigationController"
import type { SettingsController } from "@/control/SettingsController"
import type { SetupController } from "@/control/SetupController"
import type { SyncController } from "@/control/SyncController"
import type { UnlockController } from "@/control/UnlockController"
import { DEFAULT_SETTINGS } from "@/domain/Settings"
import type { Context } from "@/lib/context"
import { type AsyncResult, Ok, toPromise } from "@/lib/result"
import { getThreadName } from "@/lib/thread"
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
    performance.mark("autoUnlock:loadSetupInfo:start")
    let loadSetupInfo = await setupCtrl.loadSetupInfo(ctx)
    performance.mark("autoUnlock:loadSetupInfo:end", {
        detail: { thread: getThreadName(), ok: loadSetupInfo.ok },
    })

    if (!loadSetupInfo.ok) {
        return loadSetupInfo
    }

    if (!loadSetupInfo.value || !loadSetupInfo.value.isSetup) {
        return Ok(undefined)
    }

    let isUnlocked = false

    performance.mark("autoUnlock:tryGetPlaintextPrivateKey:start")
    let plaintextKeyData = await unlockCtrl.tryGetPlaintextPrivateKey(ctx)
    performance.mark("autoUnlock:tryGetPlaintextPrivateKey:end", {
        detail: { thread: getThreadName(), ok: plaintextKeyData.ok },
    })

    if (plaintextKeyData.ok && plaintextKeyData.value) {
        performance.mark("autoUnlock:unlock:start")
        let unlocked = await unlockCtrl.unlock(ctx, {
            plaintextKeyData: plaintextKeyData.value,
        })
        performance.mark("autoUnlock:unlock:end", {
            detail: { thread: getThreadName(), ok: unlocked.ok },
        })

        if (!unlocked.ok) {
            throw unlocked
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

    performance.mark("autoUnlock:loadSettings:start")
    let loadSettings = await settingsCtrl.loadSettings(ctx)
    performance.mark("autoUnlock:loadSettings:end", {
        detail: { thread: getThreadName(), ok: loadSettings.ok },
    })

    if (!loadSettings.ok) {
        return loadSettings
    }

    performance.mark("autoUnlock:loadSyncInfo:start")
    let loadSyncInfo = await syncCtrl.load(ctx)
    performance.mark("autoUnlock:loadSyncInfo:end", {
        detail: { thread: getThreadName(), ok: loadSyncInfo.ok },
    })

    if (!loadSyncInfo.ok) {
        return loadSyncInfo
    }

    return Ok({
        setup: {
            isSetup: true,
            step: "done",
            selectedOptions: {
                isNew: false,
                syncMethod: loadSyncInfo.value?.isEnabled
                    ? "remote-sync"
                    : "local-only",
            },
        },

        unlock: {
            state: isUnlocked ? "unlocked" : "locked",
        },

        settings: {
            isLoading: false,
            isLoaded: true,
            values: loadSettings.value,
        },

        sync: loadSyncInfo.value?.isEnabled
            ? {
                  status: "ready",
                  isSyncRequested: false,
                  info: loadSyncInfo.value,
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
