import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import type * as MemoCtrl from "@/control/MemoController"
import type { Memo, MemoID, MemoList } from "@/domain/Memo"
import type { Pagination } from "@/domain/Pagination"
import { isEqual } from "@/lib/isEqual"

export type Filter = MemoCtrl.Filter

interface MemosListState {
    memos: Memo[]

    error?: Error
    isLoading: boolean

    filter: Filter

    nextPage: Date | undefined
    hasNextPage: boolean
}

const initialState: MemosListState = {
    memos: [],
    filter: {},
    isLoading: false,
    nextPage: undefined,
    hasNextPage: true,
}

export const slice = createSlice({
    name: "list",
    initialState,
    reducers: {
        nextPage: () => {},

        loadPage: (
            state,
            _: PayloadAction<{
                pagination: Pagination<Date>
                filter?: MemoCtrl.Filter
            }>,
        ) => {
            state.isLoading = true
        },

        setFilter: (
            state,
            {
                payload,
            }: PayloadAction<{ filter: Filter; source: "user" | "navigation" }>,
        ) => {
            if (isEqual(state.filter, payload)) {
                return state
            }

            return {
                ...state,
                isLoading: true,
                error: undefined,
                memos: [],
                filter: payload.filter,
                nextPage: undefined,
                hasNextPage: true,
            } satisfies MemosListState
        },

        setMemo: (state, { payload }: PayloadAction<{ memo: Memo }>) => {
            let index = state.memos.findIndex((m) => m.id === payload.memo.id)
            if (index === -1) {
                return
            }

            state.memos[index] = payload.memo
        },

        prependMemo: (state, { payload }: PayloadAction<{ memo: Memo }>) => {
            state.isLoading = false
            state.error = undefined
            state.memos = [payload.memo, ...state.memos]
        },

        appendMemos: (state, { payload }: PayloadAction<MemoList>) => {
            state.hasNextPage = typeof payload.next !== "undefined"
            state.isLoading = false
            state.error = undefined
            state.memos = [...state.memos, ...payload.items]
            state.nextPage = payload.next
        },

        removeMemo: (state, { payload }: PayloadAction<{ id: MemoID }>) => {
            let index = state.memos.findIndex((m) => m.id === payload.id)
            if (index === -1) {
                return
            }

            state.memos.splice(index, 1)
        },

        setError: (state, { payload }: PayloadAction<{ error: Error }>) => {
            state.isLoading = false
            state.error = payload.error
            state.nextPage = undefined
            state.hasNextPage = false
        },
    },

    selectors: {
        memos: (state) => state.memos,
        filter: (state) => state.filter,
        isLoading: (state) => state.isLoading,
        error: (state) => state.error,
        nextPage: (state) => state.nextPage,
        hasNextPage: (state) => state.hasNextPage,
        getMemo: (state, id: MemoID) => state.memos.find((m) => m.id === id),
    },
})
