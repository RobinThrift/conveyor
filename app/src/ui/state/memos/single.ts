import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import type { Memo, MemoID } from "@/domain/Memo"

interface SingleMemoState {
    memoID?: MemoID
    memo?: Memo
    error?: Error
    isLoading: boolean
}

const initialState: SingleMemoState = {
    memo: undefined,
    isLoading: false,
    error: undefined,
}

export const slice = createSlice({
    name: "single",
    initialState,
    reducers: {
        setCurrentSingleMemoID: (state, { payload }: PayloadAction<{ id: MemoID }>) => {
            if (state.memoID === payload.id) {
                return
            }
            state.memoID = payload.id
            state.memo = undefined
            state.isLoading = false
            state.error = undefined
        },

        startLoadingSingleMemo: (state) => {
            state.isLoading = true
        },

        setCurrentSingleMemo: (state, { payload }: PayloadAction<{ memo: Memo }>) =>
            ({
                ...state,
                isLoading: false,
                memoID: payload.memo.id,
                memo: payload.memo,
                error: undefined,
            }) satisfies SingleMemoState,

        setError: (state, { payload }: PayloadAction<{ error: Error }>) =>
            ({
                ...state,
                isLoading: false,
                memo: undefined,
                error: payload.error,
            }) satisfies SingleMemoState,
    },

    selectors: {
        currentMemoID: (state) => state.memoID,
        currentMemo: (state) => state.memo,
        isLoadingSingleMemo: (state) => state.isLoading,
        singleMemoError: (state) => state.error,
    },
})
