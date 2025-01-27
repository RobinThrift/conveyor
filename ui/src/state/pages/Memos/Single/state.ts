import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import type { Memo, MemoID } from "@/domain/Memo"
import { slice as memoEntities } from "@/state/entities/memos"
import type { StartListening } from "@/state/rootStore"
import * as memoStorage from "@/storage/memos"

export interface MemosSinglePageState {
    memoID: MemoID
}

const initialState: MemosSinglePageState = {
    memoID: undefined as any,
}

export const slice = createSlice({
    name: "pages.Memos.Single",
    reducerPath: "pages.Memos.Single",
    initialState,
    reducers: {
        setMemoID: (state, { payload }: PayloadAction<{ memoID: MemoID }>) =>
            ({
                ...state,
                memoID: payload.memoID,
            }) satisfies MemosSinglePageState,
    },

    selectors: {
        memoID: (state) => state.memoID,
    },
})

export const registerEffects = (startListening: StartListening) => {
    startListening({
        actionCreator: slice.actions.setMemoID,
        effect: async (
            { payload },
            { cancelActiveListeners, dispatch, getState, signal },
        ) => {
            cancelActiveListeners()

            let isLoading = memoEntities.selectors.isLoading(
                getState(),
                payload.memoID,
            )
            if (isLoading) {
                return
            }

            dispatch(
                memoEntities.actions.setIsLoading({ memoID: payload.memoID }),
            )

            let memo: Memo
            try {
                memo = await memoStorage.get({
                    id: payload.memoID,
                    signal,
                })
            } catch (err) {
                dispatch(
                    memoEntities.actions.setError({
                        memoID: payload.memoID,
                        error: err as Error,
                    }),
                )
                return
            }

            dispatch(memoEntities.actions.setMemo(memo))
        },
    })
}
