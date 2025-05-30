import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import type * as MemoCtrl from "@/control/MemoController"
import type { Memo } from "@/domain/Memo"

export type CreateMemoRequest = MemoCtrl.CreateMemoRequest

export interface MemoCreatestate {
    error?: Error
    isLoading: boolean
}

const initialState: MemoCreatestate = {
    error: undefined,
    isLoading: false,
}

export const slice = createSlice({
    name: "create",
    initialState,
    reducers: {
        create: (state, _: PayloadAction<{ memo: CreateMemoRequest }>) =>
            ({
                ...state,
                isLoading: true,
                error: undefined,
            }) satisfies MemoCreatestate,

        setDone: (state, _: PayloadAction<{ memo: Memo }>) =>
            ({
                ...state,
                isLoading: false,
                error: undefined,
            }) satisfies MemoCreatestate,

        setError: (state, { payload }: PayloadAction<{ error: Error }>) =>
            ({
                ...state,
                isLoading: false,
                error: payload.error,
            }) satisfies MemoCreatestate,
    },

    selectors: {
        isCreatingMemo: (state) => state.isLoading,
        createMemoError: (state) => state.error,
    },
})
