import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import type { Memo } from "@/domain/Memo"
import { slice as memoEntities } from "@/state/entities/memos"
import type { StartListening } from "@/state/rootStore"
import * as memoStorage from "@/storage/memos"

export type CreateMemoRequest = memoStorage.CreateMemoRequest

export interface MemosNewPageState {
    isLoading: boolean
    error?: Error
}

const initialState: MemosNewPageState = {
    isLoading: false,
}

export const slice = createSlice({
    name: "pages.Memos.New",
    reducerPath: "pages.Memos.New",
    initialState,
    reducers: {
        create: (
            state,
            _: PayloadAction<{ memo: CreateMemoRequest }>,
        ): MemosNewPageState => ({
            ...state,
            error: undefined,
            isLoading: true,
        }),

        setIsDoneLoading: (state): MemosNewPageState => ({
            ...state,
            error: undefined,
            isLoading: false,
        }),

        setError: (
            state,
            { payload }: PayloadAction<{ error: Error }>,
        ): MemosNewPageState => ({
            ...state,
            error: payload.error,
            isLoading: false,
        }),
    },

    selectors: {
        isLoading: (state) => state.isLoading,
        error: (state) => state.error,
    },
})

export const registerEffects = (startListening: StartListening) => {
    startListening({
        actionCreator: slice.actions.create,
        effect: async (
            { payload },
            { cancelActiveListeners, dispatch, signal },
        ) => {
            cancelActiveListeners()

            let created: Memo
            try {
                created = await memoStorage.create({
                    memo: payload.memo,
                    signal,
                })
            } catch (err) {
                dispatch(
                    slice.actions.setError({
                        error: err as Error,
                    }),
                )
                return
            }

            if (signal.aborted) {
                return
            }

            dispatch(slice.actions.setIsDoneLoading())
            dispatch(memoEntities.actions.setMemo(created))
        },
    })
}
