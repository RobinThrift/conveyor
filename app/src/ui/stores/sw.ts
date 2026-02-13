import { batch, createActions, createEffect, createStore } from "@/lib/store"
import type { Updater } from "@/lib/Updater"

export const needsUpdate = createStore<boolean>("sw/needsUpdate", false)

export const updateErr = createStore<Error | undefined>("sw/updateErr", undefined)

const updateTriggered = createStore<boolean>("sw/updateTriggered", false)

export const actions = createActions({
    triggerUpdate: () =>
        batch(() => {
            updateTriggered.setState(true)
            updateErr.setState(undefined)
        }),
})

export function registerEffects(updater: Updater) {
    needsUpdate.setState(updater.hasUpdate)

    updater.addEventListener("updateAvailable", () => {
        batch(() => needsUpdate.setState(true))
    })

    createEffect("sw/updateTriggered", {
        fn: async (_, { batch }) => {
            if (!updateTriggered.state) {
                return
            }

            batch(() => needsUpdate.setState(false))

            let [, err] = await updater.update()
            batch(() => updateErr.setState(err))
        },
        deps: [updateTriggered],
        autoMount: true,
    })
}
