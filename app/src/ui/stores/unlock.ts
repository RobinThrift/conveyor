import type { BackendClient } from "@/backend/BackendClient"
import type { NavigationController } from "@/control/NavigationController"
import type { PlaintextPrivateKey } from "@/lib/crypto"
import { batch, createActions, createEffect, createStore } from "@/lib/store"

import { actions as settings } from "./settings"
import { actions as sync } from "./sync"

export type UnlockStatus = "locked" | "unlocking" | "unlocked"

export const status = createStore<UnlockStatus>("unlock/state", "locked")

export const error = createStore<Error | undefined>("unlock/error", undefined)

type UnlockRequest = {
    plaintextKeyData: PlaintextPrivateKey
    storeKey?: boolean
    db?: {
        file?: string
        enableTracing?: boolean
    }
}
const unlockRequest = createStore<UnlockRequest | undefined>("unlock/unlockRequest", undefined)

export const actions = createActions({
    unlock: (req: UnlockRequest) => {
        batch(() => {
            error.setState(undefined)
            status.setState("unlocking")
            unlockRequest.setState(req)
        })
    },
})

export const selectors = {
    isUnlocked: (state: UnlockStatus) => state === "unlocked",
}

export function registerEffects({
    backend,
    navCtrl,
}: {
    backend: BackendClient
    navCtrl: NavigationController
}) {
    let [, unmount] = createEffect("unlock/unlock", {
        fn: async (ctx, { batch }) => {
            if (selectors.isUnlocked(status.state)) {
                unmount()
                return
            }

            let req = unlockRequest.state
            if (!req) {
                return
            }

            batch(() => unlockRequest.setState(undefined))

            let [, err] = await backend.unlock.unlock(ctx, {
                plaintextKeyData: req.plaintextKeyData,
                storeKey: req.storeKey,
                db: req.db,
            })

            if (err) {
                batch(() => _actions.setError(err))
                return
            }

            batch(() => {
                _actions.setUnlocked()
                settings.load()
                sync.loadSyncInfo()
            })

            navCtrl.push({
                screen: "list",
                params: {},
            })
        },
        autoMount: true,
        deps: [status, unlockRequest],
        eager: false,
    })
}

const _actions = createActions({
    setError: (err: Error) => {
        status.setState("locked")
        error.setState(err)
    },
    setUnlocked: () => {
        error.setState(undefined)
        status.setState("unlocked")
        unlockRequest.setState(undefined)
    },
})

if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
        if (!newModule) {
            return
        }

        newModule.status.setState(status.state)
        newModule.error.setState(error.state)
    })
}
