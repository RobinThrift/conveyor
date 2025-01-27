import type { Memo, MemoID } from "@/domain/Memo"
import type { StartListening } from "@/state/rootStore"
import * as memoStorage from "@/storage/memos"
import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

export type UpdateMemoRequest = memoStorage.UpdateMemoRequest

export interface MemoEntitiesState {
    memos: Record<MemoID, Memo>
    isLoading: Record<MemoID, boolean>
    errors: Record<MemoID, Error>
}

const initialState: MemoEntitiesState = {
    memos: {},
    isLoading: {},
    errors: {},
}

export const slice = createSlice({
    name: "Memos",
    reducerPath: "entities.Memos",
    initialState,
    reducers: {
        update: (state, _: PayloadAction<{ memo: UpdateMemoRequest }>) => state,

        setMemo: (state, { payload: memo }: PayloadAction<Memo>) => {
            state.memos[memo.id] = memo
            state.isLoading[memo.id] = false
        },

        insertMemos: (state, { payload: memos }: PayloadAction<Memo[]>) => {
            memos.forEach((memo) => {
                state.memos[memo.id] = memo
                state.isLoading[memo.id] = false
            })
        },

        setIsLoading: (
            state,
            { payload }: PayloadAction<{ memoID: string }>,
        ) => {
            state.isLoading[payload.memoID] = true
        },

        setError: (
            state,
            { payload }: PayloadAction<{ memoID: string; error: Error }>,
        ) => {
            state.errors[payload.memoID] = payload.error
            state.isLoading[payload.memoID] = false
        },
    },

    selectors: {
        allMemos: (state) => state.memos,
        allLoadingStates: (state) => state.isLoading,
        allErrors: (state) => state.errors,
        memo: (state, id: MemoID) => state.memos[id],
        isLoading: (state, id: MemoID) => state.isLoading[id],
        hasError: (state, id: MemoID) => state.errors[id],
    },
})

export const registerEffects = (startListening: StartListening) => {
    startListening({
        actionCreator: slice.actions.update,
        effect: async (
            { payload: { memo } },
            { cancelActiveListeners, dispatch, signal },
        ) => {
            cancelActiveListeners()

            let updated: Memo
            try {
                await memoStorage.update({
                    memo,
                    signal,
                })

                updated = await memoStorage.get({
                    id: memo.id,
                    signal,
                })
            } catch (err) {
                dispatch(
                    slice.actions.setError({
                        memoID: memo.id,
                        error: err as Error,
                    }),
                )
                return
            }

            dispatch(slice.actions.setMemo(updated))
        },
    })
}
