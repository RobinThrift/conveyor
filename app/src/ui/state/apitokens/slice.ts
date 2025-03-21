import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

import type { CreateAPITokenRequest } from "@/control/APITokenController"
import type { APIToken, APITokenList } from "@/domain/APIToken"
import { goBackOnePage } from "@/domain/Pagination"

export type { CreateAPITokenRequest } from "@/control/APITokenController"

export interface APITokensState {
    isLoading: boolean
    error?: Error
    apiTokens: APIToken[]
    pages: (string | undefined)[]
    currentPage: string | undefined
    nextPage: string | undefined
    hasNextPage: boolean
    lastCreatedValue: string | undefined
}

const initialState: APITokensState = {
    isLoading: false,
    error: undefined,
    apiTokens: [],
    pages: [],
    currentPage: undefined,
    nextPage: undefined,
    hasNextPage: true,
    lastCreatedValue: undefined,
}

export const slice = createSlice({
    name: "apitokens",
    initialState,
    reducers: {
        previousPage: (state) => {
            if (state.pages.length === 0 || state.isLoading) {
                return
            }

            let [prevPage, nextPages] = goBackOnePage(state.pages)

            state.pages = nextPages
            state.currentPage = prevPage
        },
        nextPage: (state) => {
            if (!state.nextPage || state.isLoading) {
                return
            }

            state.pages = [...state.pages, state.currentPage]
            state.currentPage = state.nextPage
            state.nextPage = undefined
        },

        loadPage: () => {},

        setLoadingState: (
            state,
            { payload }: PayloadAction<{ isLoading: boolean; error?: Error }>,
        ) => {
            state.isLoading = payload.isLoading
            state.error = payload.error
        },

        createAPIToken: (_state, _: PayloadAction<CreateAPITokenRequest>) => {},

        deleteAPIToken: (_state, _: PayloadAction<{ name: string }>) => {},

        setAPITokens: (state, { payload }: PayloadAction<APITokenList>) => {
            state.apiTokens = payload.items
            state.nextPage = payload.next
            state.hasNextPage = typeof payload.next !== "undefined"
        },

        removeAPIToken: (_state, _: PayloadAction<{ name: string }>) => {},

        setLastCreatedValue: (state, { payload }: PayloadAction<string>) => {
            state.lastCreatedValue = payload
        },

        setError: (state, { payload }: PayloadAction<{ error: Error }>) => {
            state.isLoading = false
            state.error = payload.error
        },
    },

    selectors: {
        apiTokens: (state) => state.apiTokens,
        isLoading: (state) => state.isLoading,
        error: (state) => state.error,
        pages: (state) => state.pages,
        currentPage: (state) => state.currentPage,
        hasPreviousPage: (state) => state.pages.length !== 0,
        hasNextPage: (state) => state.hasNextPage,
        lastCreatedValue: (state) => state.lastCreatedValue,
    },
})
