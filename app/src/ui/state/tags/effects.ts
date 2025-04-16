import type { MemoController } from "@/control/MemoController"
import { BaseContext } from "@/lib/context"
import type { StartListening } from "@/ui/state/rootStore"

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
            let isLoading = tags.selectors.isLoading(getState())
            if (isLoading) {
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
}
