import type { MemoController } from "@/control/MemoController"
import { BaseContext } from "@/lib/context"
import type { StartListening } from "@/ui/state/rootStore"

import * as tags from "./slice"

// @TODO: use real pagination
const tagPageSize = 1000

export const registerEffects = (
    startListening: StartListening,
    {
        memoCtrl,
    }: {
        memoCtrl: MemoController
    },
) => {
    startListening({
        actionCreator: tags.slice.actions.loadTags,
        effect: async (_, { cancelActiveListeners, dispatch, signal }) => {
            cancelActiveListeners()

            let list = await memoCtrl.listTags(BaseContext.withSignal(signal), {
                pagination: { pageSize: tagPageSize },
            })

            if (!list.ok) {
                dispatch(
                    tags.slice.actions.setError({
                        error: list.err,
                    }),
                )
                return
            }

            if (signal.aborted) {
                return
            }

            dispatch(tags.slice.actions.setTags(list.value))
        },
    })
}
