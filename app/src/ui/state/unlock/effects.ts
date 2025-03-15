import type { UnlockController } from "@/control/UnlockController"
import { BaseContext } from "@/lib/context"
import type { StartListening } from "@/ui/state/rootStore"

import { slice } from "./slice"

export const registerEffects = (
    startListening: StartListening,
    {
        unlockCtrl,
    }: {
        unlockCtrl: UnlockController
    },
) => {
    startListening({
        actionCreator: slice.actions.unlock,
        effect: async (
            { payload },
            { cancelActiveListeners, getState, dispatch, signal },
        ) => {
            if (slice.selectors.isUnlocked(getState())) {
                return
            }

            cancelActiveListeners()

            let unlocked = await unlockCtrl.unlock(
                BaseContext.withSignal(signal),
                payload,
            )

            if (signal.aborted) {
                return
            }

            if (!unlocked.ok) {
                dispatch(
                    slice.actions.setIsUnlocked({
                        error: unlocked.err,
                        isUnlocked: false,
                    }),
                )
                return
            }

            dispatch(
                slice.actions.setIsUnlocked({
                    isUnlocked: true,
                }),
            )
        },
    })
}
