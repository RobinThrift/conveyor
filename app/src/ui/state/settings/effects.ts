import type { SettingsController } from "@/control/SettingsController"
import { BaseContext } from "@/lib/context"
import type { StartListening } from "@/ui/state/rootStore"

import { slice } from "./slice"

export const registerEffects = (
    startListening: StartListening,
    {
        settingsCtrl,
    }: {
        settingsCtrl: SettingsController
    },
) => {
    startListening({
        actionCreator: slice.actions.loadStart,
        effect: async (
            _,
            { cancelActiveListeners, getState, dispatch, signal },
        ) => {
            if (slice.selectors.isLoaded(getState())) {
                return
            }

            cancelActiveListeners()

            let loaded = await settingsCtrl.loadSettings(
                BaseContext.withSignal(signal),
            )

            if (!loaded.ok) {
                dispatch(slice.actions.setError(loaded.err))
                return
            }

            dispatch(slice.actions.loadDone(loaded.value))
        },
    })

    startListening({
        actionCreator: slice.actions.set,
        effect: async (
            { payload },
            { cancelActiveListeners, dispatch, signal },
        ) => {
            cancelActiveListeners()

            let updated = await settingsCtrl.updateSetting(
                BaseContext.withSignal(signal),
                {
                    key: payload.key,
                    value: payload.value,
                },
            )

            if (!updated.ok) {
                dispatch(slice.actions.setError(updated.err))
            }
        },
    })
}
