import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import type { Memo, MemoID, MemoList } from "@/domain/Memo"
import type { Pagination } from "@/domain/Pagination"
import { isEqual } from "@/lib/isEqual"
import type * as memoStorage from "@/storage/memos"
import type { StartListening } from "@/ui/state/rootStore"

const pageSize = 25

export type Filter = memoStorage.Filter

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
                filter?: memoStorage.Filter
            }>,
        ) => {
            state.isLoading = true
        },

        setFilter: (state, { payload }: PayloadAction<Filter>) => {
            if (isEqual(state.filter, payload)) {
                return state
            }

            return {
                ...state,
                isLoading: true,
                error: undefined,
                memos: [],
                filter: payload,
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
            return {
                ...state,
                isLoading: false,
                error: undefined,
                memos: [payload.memo, ...state.memos],
            } satisfies MemosListState
        },

        appendMemos: (state, { payload }: PayloadAction<MemoList>) => {
            let hasNextPage = typeof payload.next !== "undefined"

            return {
                ...state,
                isLoading: false,
                error: undefined,
                memos: [...state.memos, ...payload.items],
                nextPage: payload.next,
                hasNextPage,
            } satisfies MemosListState
        },

        removeMemo: (state, { payload }: PayloadAction<{ id: MemoID }>) => {
            let index = state.memos.findIndex((m) => m.id === payload.id)
            if (index === -1) {
                return
            }

            state.memos.splice(index, 1)
        },

        setError: (state, { payload }: PayloadAction<{ error: Error }>) =>
            ({
                ...state,
                isLoading: false,
                error: payload.error,
                nextPage: undefined,
                hasNextPage: true,
            }) satisfies MemosListState,
    },

    selectors: {
        memos: (state) => state.memos,
        filter: (state) => state.filter,
        isLoading: (state) => state.isLoading,
        error: (state) => state.error,
        nextPage: (state) => state.nextPage,
        hasNextPage: (state) => state.hasNextPage,
    },
})

export const registerEffects = (startListening: StartListening) => {
    startListening({
        actionCreator: slice.actions.nextPage,
        effect: async (_, { cancelActiveListeners, dispatch, getState }) => {
            cancelActiveListeners()

            let state = getState()

            let hasNextPage = slice.selectors.hasNextPage(state.memos)
            if (!hasNextPage) {
                return
            }

            let filter = slice.selectors.filter(state.memos)
            let nextPage = slice.selectors.nextPage(state.memos)

            dispatch(
                slice.actions.loadPage({
                    filter,
                    pagination: {
                        after: nextPage,
                        pageSize,
                    },
                }),
            )
        },
    })

    startListening({
        actionCreator: slice.actions.setFilter,
        effect: async (_, { cancelActiveListeners, dispatch, getState }) => {
            cancelActiveListeners()

            let state = getState()

            let isLoading = slice.selectors.isLoading(state.memos)
            if (!isLoading) {
                return
            }

            let filter = slice.selectors.filter(state.memos)

            dispatch(
                slice.actions.loadPage({
                    filter,
                    pagination: {
                        pageSize,
                    },
                }),
            )
        },
    })
}
