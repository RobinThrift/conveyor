import { BaseContext } from "@/lib/context"
import type { MemoStorage } from "@/storage/memos"
import type { RootState, StartListening } from "@/ui/state/rootStore"

import * as tags from "./slice"

export const slice = tags.slice

export const selectors = {
    ...slice.getSelectors((state: RootState) => state.tags),
}

export const actions = {
    ...slice.actions,
}

// @TODO: use real pagination
const tagPageSize = 1000

export const registerStorageEffects = ({
    startListening,
    memoStorage,
}: {
    memoStorage: MemoStorage
    startListening: StartListening
}) => {
    startListening({
        actionCreator: tags.slice.actions.loadTags,
        effect: async (_, { cancelActiveListeners, dispatch, signal }) => {
            cancelActiveListeners()

            let list = await memoStorage.listTags(
                BaseContext.withData("db", undefined).withSignal(signal),
                {
                    pagination: { pageSize: tagPageSize },
                },
            )

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
