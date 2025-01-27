import type { Tag, TagList } from "@/domain/Tag"
import type { StartListening } from "@/state/rootStore"
import * as tagStorage from "@/storage/tags"
import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

// @TODO: use real pagination
const tagPageSize = 1000

export interface TagsState {
    tags: Record<string, Tag>

    error?: Error
    isLoading: boolean

    nextPage: string | undefined
    hasNextPage: boolean
}

const initialState: TagsState = {
    tags: {},

    isLoading: false,

    nextPage: undefined,
    hasNextPage: false,
}

export const slice = createSlice({
    name: "Tags",
    reducerPath: "entities.Tags",
    initialState,
    reducers: {
        loadTags: (state) => {
            return {
                ...state,
                isLoadingTags: true,
                error: undefined,
            }
        },

        setTags: (state, { payload }: PayloadAction<Tag[]>) => {
            return {
                ...state,
                isLoadingTags: false,
                error: undefined,
                tags: Object.fromEntries(payload.map((t) => [t.tag, t])),
            }
        },

        setError: (state, { payload }: PayloadAction<{ error: Error }>) =>
            ({
                ...state,
                isLoading: false,
                error: payload.error,
                nextPage: undefined,
                hasNextPage: true,
            }) satisfies TagsState,
    },

    selectors: {
        tags: (state) => state.tags,
        isLoading: (state) => state.isLoading,
    },
})

export const registerEffects = (startListening: StartListening) => {
    startListening({
        actionCreator: slice.actions.loadTags,
        effect: async (
            _,
            { cancelActiveListeners, signal, dispatch, getState },
        ) => {
            cancelActiveListeners()

            let isLoading = slice.selectors.isLoading(getState())
            if (isLoading) {
                return
            }

            let tags: TagList
            try {
                tags = await tagStorage.list({
                    pagination: { pageSize: tagPageSize },
                    signal,
                })
            } catch (err) {
                dispatch(slice.actions.setError({ error: err as Error }))
                return
            }

            dispatch(slice.actions.setTags(tags.items))
        },
    })
}
