import type { Memo, MemoList } from "@/domain/Memo"
import { isEqual } from "@/helper"
import * as memoStorage from "@/storage/memos"
import { type PayloadAction, createSlice } from "@reduxjs/toolkit"
import { slice as notifications } from "./notifications"
import type { StartListening } from "./rootStore"

const pageSize = 10

export type CreateMemoRequest = memoStorage.CreateMemoRequest
export type UpdateMemoRequest = memoStorage.UpdateMemoRequest
export type Filter = memoStorage.Filter

export interface MemosState {
    items: Memo[]

    error?: Error
    isLoading: boolean

    filter: Filter

    nextPage: Date | undefined
    hasNextPage: boolean
}

const initialState: MemosState = {
    items: [],

    filter: {},

    isLoading: false,

    nextPage: undefined,
    hasNextPage: false,
}

export const slice = createSlice({
    name: "MemoList",
    initialState,
    reducers: {
        nextPage: (state) => {
            if (!state.nextPage) {
                return state
            }

            return {
                ...state,
                isLoading: true,
            }
        },
        loadPage: (state) => ({
            ...state,
            isLoading: true,
        }),
        create: (state, _: PayloadAction<CreateMemoRequest>) => ({
            ...state,
            isLoading: true,
        }),
        update: (
            state,
            _: PayloadAction<{ memo: UpdateMemoRequest; removeItem: boolean }>,
        ) => ({
            ...state,
            isLoading: true,
        }),
        setFilter: (state, { payload }: PayloadAction<Filter>) => {
            if (isEqual(state.filter, payload)) {
                return state
            }

            return {
                ...state,
                isLoading: true,
                error: undefined,
                items: [],
                filter: payload,
                pages: [],
                currentPage: undefined,
                nextPage: undefined,
                hasNextPage: true,
            }
        },
        setItems: (state, { payload }: PayloadAction<Memo[]>) => {
            return {
                ...state,
                isLoading: false,
                error: undefined,
                items: payload,
            }
        },
        prependItem: (state, { payload }: PayloadAction<Memo>) => ({
            ...state,
            items: [payload, ...state.items],
        }),
        appendItems: (state, { payload }: PayloadAction<MemoList>) => {
            let hasNextPage = typeof payload.next !== "undefined"

            return {
                ...state,
                isLoading: false,
                error: undefined,
                items: [...state.items, ...payload.items],
                nextPage: payload.next,
                hasNextPage,
            }
        },
        setError: (state, { payload }: PayloadAction<{ error: Error }>) => ({
            ...state,
            isLoading: false,
            error: payload.error,
            items: [],
            pages: [],
            currentPage: undefined,
            nextPage: undefined,
            hasNextPage: true,
        }),
    },
})

export const registerEffects = (startListening: StartListening) => {
    startListening({
        actionCreator: slice.actions.nextPage,
        effect: async (_, { cancelActiveListeners, dispatch, getState }) => {
            cancelActiveListeners()

            let { memoList: state } = getState()

            if (!state.isLoading) {
                return
            }

            dispatch(slice.actions.loadPage())
        },
    })

    startListening({
        actionCreator: slice.actions.setFilter,
        effect: async (_, { cancelActiveListeners, dispatch, getState }) => {
            cancelActiveListeners()

            let { memoList: state } = getState()

            if (!state.isLoading) {
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

            let { memoList: state } = getState()

            let memos: MemoList
            try {
                memos = await memoStorage.list({
                    pagination: {
                        after: state.nextPage,
                        pageSize,
                    },
                    filter: state.filter,
                    signal,
                })
            } catch (err) {
                dispatch(slice.actions.setError({ error: err as Error }))
                return
            }

            dispatch(slice.actions.appendItems(memos))
        },
    })

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
                    memo: payload,
                    signal,
                })
            } catch (err) {
                dispatch(slice.actions.setError({ error: err as Error }))
                return
            }

            if (signal.aborted) {
                return
            }

            dispatch(slice.actions.prependItem(created))
            dispatch(
                notifications.actions.add({
                    notification: {
                        type: "info",
                        title: "New Memo created",
                        durationMs: 1000,
                    },
                }),
            )
        },
    })

    startListening({
        actionCreator: slice.actions.update,
        effect: async (
            { payload: { memo, removeItem } },
            { cancelActiveListeners, dispatch, signal, getState },
        ) => {
            cancelActiveListeners()

            let { memoList: state } = getState()

            try {
                await memoStorage.update({
                    memo,
                    signal,
                })
            } catch (err) {
                dispatch(slice.actions.setError({ error: err as Error }))
                return
            }

            let items = [...state.items]
            let index = items.findIndex((m) => m.id === memo.id)

            if (index === -1) {
                return
            }

            if (removeItem) {
                items.splice(index, 1)
            } else {
                if (index !== -1) {
                    items[index] = {
                        ...items[index],
                        updatedAt: new Date(),
                        ...memo,
                    }
                }
            }

            dispatch(slice.actions.setItems(items))
            dispatch(
                notifications.actions.add({
                    notification: {
                        type: "info",
                        title: "Memo Updated",
                        durationMs: 1000,
                    },
                }),
            )
        },
    })

    startListening({
        actionCreator: slice.actions.setError,
        effect: async ({ payload: { error } }, { dispatch }) => {
            let [title, message] = error.message.split(/:\n/, 2)
            dispatch(
                notifications.actions.add({
                    notification: {
                        type: "error",
                        title,
                        message,
                    },
                }),
            )
        },
    })
}
