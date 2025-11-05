import type { BackendClient } from "@/backend/BackendClient"
import type { NavigationController } from "@/control/NavigationController"
import { batch, createActions, createStore } from "@/lib/store"

import * as navigation from "./navigation"
import * as settings from "./settings"
import * as setup from "./setup"
import * as sync from "./sync"
import * as unlock from "./unlock"

export const isReady = createStore("backend/isReady", false)
export const error = createStore<Error | undefined>("backend/error", undefined)

const actions = createActions({
    isReady: () => {
        batch(() => {
            isReady.setState(true)
            error.setState(undefined)
        })
    },
})

export function registerEffects({
    backend,
    navCtrl,
}: {
    backend: BackendClient
    navCtrl: NavigationController
}) {
    let unsub = backend.addEventListener("init/autoUnlock", (data) => {
        unsub()

        batch(() => {
            setup.isSetup.setState(data.isSetup)
            if (data.isSetup) {
                setup.step.setState("done")
                if ("settings" in data && typeof data.settings !== "undefined") {
                    settings.values.setState(data.settings.values)
                    settings.state.setState({ state: "done" })
                }

                if (data.isUnlocked) {
                    unlock.status.setState("unlocked")
                }

                if ("sync" in data && typeof data.sync !== "undefined" && data.sync.isEnabled) {
                    sync.status.setState("ready")
                    sync.info.setState(data.sync)
                }
            } else {
                setup.actions.setStep("initial-setup")
            }
        })

        if (!data.isSetup) {
            navCtrl.push({
                screen: "setup",
                params: {},
            })
            actions.isReady()
            return
        }

        if (!data.isUnlocked) {
            navCtrl.push({
                screen: "unlock",
                params: {},
            })
            actions.isReady()
            return
        }

        let navInit = navCtrl.init()
        navigation.actions.init(navInit)

        actions.isReady()
    })
}

if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
        if (!newModule) {
            return
        }

        newModule.isReady.setState(isReady.state)
    })
}
