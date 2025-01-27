import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import type { MemoID, MemoList } from "@/domain/Memo"
import { isEqual } from "@/helper"
import { slice as memoEntities } from "@/state/entities/memos"
import type { StartListening } from "@/state/rootStore"
import * as memoStorage from "@/storage/memos"

const pageSize = 25

export type Filter = memoStorage.Filter

export interface SettingsPageState {
    memos: MemoID[]

    error?: Error
    isLoadingMemos: boolean

    filter: Filter

    nextPage: Date | undefined
    hasNextPage: boolean
}

const initialState: SettingsPageState = {
    memos: [],

    filter: {},

    isLoadingMemos: false,

    nextPage: undefined,
    hasNextPage: false,
}

export const slice = createSlice({
    name: "pages.Memos.List",
    reducerPath: "pages.Memos.List",
    initialState,
    reducers: {
        nextPage: (state) => {
            if (!state.nextPage) {
                return state
            }

            return {
                ...state,
                isLoadingMemos: true,
            } satisfies SettingsPageState
        },

        loadPage: (state) =>
            ({
                ...state,
                isLoadingMemos: true,
            }) satisfies SettingsPageState,

        setFilter: (state, { payload }: PayloadAction<Filter>) => {
            if (isEqual(state.filter, payload)) {
                return state
            }

            return {
                ...state,
                isLoadingMemos: true,
                error: undefined,
                memos: [],
                filter: payload,
                nextPage: undefined,
                hasNextPage: true,
            } satisfies SettingsPageState
        },

        appendMemos: (
            state,
            { payload }: PayloadAction<{ memos: MemoID[]; next?: Date }>,
        ) => {
            let hasNextPage = typeof payload.next !== "undefined"

            return {
                ...state,
                isLoadingMemos: false,
                error: undefined,
                memos: [...state.memos, ...payload.memos],
                nextPage: payload.next,
                hasNextPage,
            } satisfies SettingsPageState
        },

        removeMemo: (state, { payload }: PayloadAction<{ memoID: MemoID }>) => {
            let index = state.memos.findIndex((m) => m === payload.memoID)
            if (index === -1) {
                return
            }

            state.memos.splice(index, 1)
        },

        setError: (state, { payload }: PayloadAction<{ error: Error }>) =>
            ({
                ...state,
                isLoadingMemos: false,
                error: payload.error,
                nextPage: undefined,
                hasNextPage: true,
            }) satisfies SettingsPageState,
    },

    selectors: {
        memosInList: (state) => state.memos,
        filter: (state) => state.filter,
        isLoadingMemos: (state) => state.isLoadingMemos,
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

            let isLoadingMemos = slice.selectors.isLoadingMemos(getState())
            if (!isLoadingMemos) {
                return
            }

            dispatch(slice.actions.loadPage())
        },
    })

    startListening({
        actionCreator: slice.actions.setFilter,
        effect: async (_, { cancelActiveListeners, dispatch, getState }) => {
            cancelActiveListeners()

            let isLoadingMemos = slice.selectors.isLoadingMemos(getState())
            if (!isLoadingMemos) {
                return
            }

            dispatch(slice.actions.loadPage())
        },
    })

    startListening({
        actionCreator: slice.actions.loadPage,
        effect: async (
            _,
            { cancelActiveListeners, dispatch, getState, signal },
        ) => {
            cancelActiveListeners()

            let filter = slice.selectors.filter(getState())
            let nextPage = slice.selectors.nextPage(getState())

            let memos: MemoList
            try {
                memos = await memoStorage.list({
                    pagination: {
                        after: nextPage,
                        pageSize,
                    },
                    filter,
                    signal,
                })
            } catch (err) {
                dispatch(slice.actions.setError({ error: err as Error }))
                return
            }

            dispatch(memoEntities.actions.insertMemos(memos.items))
            dispatch(
                slice.actions.appendMemos({
                    memos: memos.items.map((m) => m.id),
                    next: memos.next,
                }),
            )
        },
    })

    startListening({
        actionCreator: memoEntities.actions.update,
        effect: async (
            { payload },
            { cancelActiveListeners, dispatch, getState },
        ) => {
            cancelActiveListeners()

            let memosInList = slice.selectors.memosInList(getState())

            if (!memosInList.includes(payload.memo.id)) {
                return
            }

            if (payload.memo.isDeleted || payload.memo.isArchived) {
                dispatch(slice.actions.removeMemo({ memoID: payload.memo.id }))
            }
        },
    })
}
