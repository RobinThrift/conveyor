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
        loadTags: (_) => {},

        setTags: (state, { payload }: PayloadAction<{ items: Tag[] }>) => {
            state.isLoading = false
            state.error = undefined
            state.tags = payload.items
        },

        setState: (
            state,
            { payload }: PayloadAction<{ isLoading: boolean; error?: Error }>,
        ) => {
            state.isLoading = payload.isLoading
            state.error = payload.error
        },
    },

    selectors: {
        tags: (state) => state.tags,
        isLoading: (state) => state.isLoading,
    },
})
