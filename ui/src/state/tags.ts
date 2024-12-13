import type { Tag, TagList } from "@/domain/Tag"
import * as tagsStorage from "@/storage/tags"
import { type PayloadAction, createSlice } from "@reduxjs/toolkit"
import type { StartListening } from "./rootStore"

// @TODO: use real pagination
const pageSize = 1000

export interface TagsState {
    items: Tag[]

    error?: Error
    isLoading: boolean

    nextPage: string | undefined
    hasNextPage: boolean
}

const initialState: TagsState = {
    items: [],

    isLoading: false,

    nextPage: undefined,
    hasNextPage: false,
}

export const slice = createSlice({
    name: "TagList",
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
        appendItems: (state, { payload }: PayloadAction<TagList>) => {
            let hasNextPage =
                typeof payload.next !== "undefined" && payload.next.length !== 0

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

            let { tags: state } = getState()

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

            let { tags: state } = getState()

            let tags: TagList
            try {
                tags = await tagsStorage.list({
                    pagination: {
                        after: state.nextPage,
                        pageSize,
                    },
                    signal,
                })
            } catch (err) {
                dispatch(slice.actions.setError({ error: err as Error }))
                return
            }

            dispatch(slice.actions.appendItems(tags))
        },
    })
}
