import type { SettingsController } from "@/control/SettingsController"
import { BaseContext } from "@/lib/context"
import type { RootStore, StartListening } from "@/ui/state/rootStore"

import { Second } from "@/lib/duration"
import { slice } from "./slice"

export const registerEffects = (
    startListening: StartListening,
    {
        settingsCtrl,
        rootStore,
    }: {
        settingsCtrl: SettingsController
        rootStore: RootStore
    },
) => {
    settingsCtrl.addEventListener("onSettingChanged", ({ setting }) => {
        rootStore.dispatch(
            slice.actions.setExternal({
                key: setting.key,
                value: setting.value as any,
            }),
        )
    })

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

            let [loaded, err] = await settingsCtrl.loadSettings(ctx)

            if (err) {
                dispatch(slice.actions.setError(err))
                cancel()
                return
            }

            cancel()
            dispatch(slice.actions.loadDone(loaded))
        },
    })

    startListening({
        actionCreator: slice.actions.set,
        effect: async ({ payload }, { dispatch, signal }) => {
            let [_, err] = await settingsCtrl.updateSetting(
                BaseContext.withSignal(signal),
                {
                    key: payload.key,
                    value: payload.value,
                },
            )

            if (err) {
                dispatch(slice.actions.setError(err))
            }
        },
    })
}
