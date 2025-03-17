import type { SettingsController } from "@/control/SettingsController"
import { BaseContext } from "@/lib/context"
import type { StartListening } from "@/ui/state/rootStore"

import { Second } from "@/lib/duration"
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
            let state = getState()
            if (
                slice.selectors.isLoaded(state) ||
                slice.selectors.isLoading(state)
            ) {
                return
            }

            cancelActiveListeners()

            dispatch(slice.actions.setIsLoading())

            let [ctx, cancel] = BaseContext.withSignal(signal).withTimeout(
                Second * 5,
            )

            let loaded = await settingsCtrl.loadSettings(ctx)

            if (!loaded.ok) {
                dispatch(slice.actions.setError(loaded.err))
                cancel()
                return
            }

            cancel()
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
