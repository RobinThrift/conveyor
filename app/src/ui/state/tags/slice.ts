import type { Tag } from "@/domain/Tag"
import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

export interface TagsState {
    tags: Tag[]
    error?: Error
    isLoading: boolean
}

const initialState: TagsState = {
    tags: [],
    isLoading: false,
}

export const slice = createSlice({
    name: "tags",
    initialState,
    reducers: {
        loadTags: (state) => {
            return {
                ...state,
                isLoadingTags: true,
                error: undefined,
            }
        },

        setTags: (state, { payload }: PayloadAction<{ items: Tag[] }>) =>
            ({
                ...state,
                isLoading: false,
                error: undefined,
                tags: payload.items,
            }) satisfies TagsState,

        setError: (state, { payload }: PayloadAction<{ error: Error }>) =>
            ({
                ...state,
                isLoading: false,
                error: payload.error,
            }) satisfies TagsState,
    },

    selectors: {
        tags: (state) => state.tags,
        isLoading: (state) => state.isLoading,
    },
})
