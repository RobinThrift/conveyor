import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import type { MemoContentChanges } from "@/domain/Changelog"
import type { MemoID } from "@/domain/Memo"

export interface UpdateMemoRequest {
    id: MemoID
    content?: {
        content: string
        changes: MemoContentChanges
    }
    isArchived?: boolean
    isDeleted?: boolean
}

interface MemoUpdateState {
    error?: Error
    isLoading: boolean
}

const initialState: MemoUpdateState = {
    isLoading: false,
    error: undefined,
}

export const slice = createSlice({
    name: "update",
    initialState,
    reducers: {
        update: (state, _: PayloadAction<{ memo: UpdateMemoRequest }>) =>
            ({
                ...state,
                isLoading: true,
                error: undefined,
            }) satisfies MemoUpdateState,

        setDone: (state) =>
            ({
                ...state,
                isLoading: false,
                error: undefined,
            }) satisfies MemoUpdateState,

        setError: (state, { payload }: PayloadAction<{ error: Error }>) =>
            ({
                ...state,
                isLoading: false,
                error: payload.error,
            }) satisfies MemoUpdateState,
    },

    selectors: {
        isUpdatingMemo: (state) => state.isLoading,
        updateMemoError: (state) => state.error,
    },
})
