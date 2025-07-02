import type { Tag } from "@/domain/Tag"
import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

export interface TagsState {
    tags: Tag[]
    error?: Error
    isLoading: boolean
    requiresReload: boolean
}

const initialState: TagsState = {
    tags: [],
    isLoading: false,
    requiresReload: true,
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
            state.requiresReload = false
        },

        setRequiresReload: (state) => {
            state.requiresReload = true
        },

        setState: (state, { payload }: PayloadAction<{ isLoading: boolean; error?: Error }>) => {
            state.isLoading = payload.isLoading
            state.error = payload.error
            state.requiresReload = false
        },
    },

    selectors: {
        tags: (state) => state.tags,
        isLoading: (state) => state.isLoading,
        requiresReload: (state) => state.requiresReload,
    },
})
