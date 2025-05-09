import type { NavigationController } from "@/control/NavigationController"
import type { UnlockController } from "@/control/UnlockController"
import type { Context } from "@/lib/context"
import { toPromise } from "@/lib/result"
import { type RootStore, actions, selectors } from "@/ui/state"

export async function tryAutoUnlock(
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
