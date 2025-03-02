import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import type { Memo, MemoID } from "@/domain/Memo"

interface SingleMemoState {
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
        setCurrentSingleMemoID: (_s, _a: PayloadAction<{ id: MemoID }>) =>
            ({
                memo: undefined,
                isLoading: true,
                error: undefined,
            }) satisfies SingleMemoState,

        setCurrentSingleMemo: (
            state,
            { payload }: PayloadAction<{ memo: Memo }>,
        ) =>
            ({
                ...state,
                isLoading: false,
                memo: payload.memo,
                error: undefined,
            }) satisfies SingleMemoState,

        setError: (state, { payload }: PayloadAction<{ error: Error }>) =>
            ({
                ...state,
                isLoading: false,
                error: payload.error,
            }) satisfies SingleMemoState,
    },

    selectors: {
        currentMemo: (state) => state.memo,
        isLoadingSingleMemo: (state) => state.isLoading,
        singleMemoError: (state) => state.error,
    },
})
