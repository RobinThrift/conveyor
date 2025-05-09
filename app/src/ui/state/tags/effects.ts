import type { MemoController } from "@/control/MemoController"
import { BaseContext } from "@/lib/context"
import type { StartListening } from "@/ui/state/rootStore"

import * as memos from "../memos"
import { slice as tags } from "./slice"

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
        actionCreator: tags.actions.loadTags,
        effect: async (
            _,
            { cancelActiveListeners, getState, dispatch, signal },
        ) => {
            let state = getState()
            let requiresReload = tags.selectors.requiresReload(state)
            let isLoading = tags.selectors.isLoading(state)
            if (isLoading || !requiresReload) {
                return
            }

            cancelActiveListeners()

            dispatch(
                tags.actions.setState({
                    isLoading: true,
                }),
            )

            let list = await memoCtrl.listTags(BaseContext.withSignal(signal), {
                pagination: { pageSize: tagPageSize },
            })

            if (!list.ok) {
                dispatch(
                    tags.actions.setState({
                        error: list.err,
                        isLoading: false,
                    }),
                )
                return
            }

            if (signal.aborted) {
                return
            }

            dispatch(tags.actions.setTags(list.value))
        },
    })

    startListening({
        actionCreator: memos.actions.update,
        effect: (_, { cancelActiveListeners, dispatch }) => {
            cancelActiveListeners()

            dispatch(tags.actions.setRequiresReload())
        },
    })
}
