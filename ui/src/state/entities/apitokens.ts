import type { APIToken, APITokenList } from "@/domain/APIToken"
import { goBackOnePage } from "@/domain/Pagination"
import type { StartListening } from "@/state/rootStore"
import * as apiTokensStorage from "@/storage/apitokens"
import { type PayloadAction, createSlice } from "@reduxjs/toolkit"

const pageSize = 10

export interface APITokensState {
    isLoading: boolean
    error?: Error
    items: APIToken[]
    pages: (string | undefined)[]
    currentPage: string | undefined
    nextPage: string | undefined
    hasNextPage: boolean
    lastCreatedValue: string | undefined
}

const initialState: APITokensState = {
    isLoading: false,
    items: [],
    pages: [],
    currentPage: undefined,
    nextPage: undefined,
    hasNextPage: false,
    lastCreatedValue: undefined,
}

export const slice = createSlice({
    name: "APITokens",
    reducerPath: "entities.APITokens",
    initialState,
    reducers: {
        prevPage: (state) => state,
        nextPage: (state): APITokensState => {
            if (!state.nextPage) {
                return state
            }

            return {
                ...state,
                currentPage: state.nextPage,
                pages: [...state.pages, state.currentPage],
                nextPage: undefined,
                isLoading: true,
            }
        },

        loadPage: (state): APITokensState => ({
            ...state,
            isLoading: true,
        }),

        create: (
            state,
            _: PayloadAction<{ name: string; expiresAt: Date }>,
        ): APITokensState => ({
            ...state,
            isLoading: true,
        }),

        del: (state, _: PayloadAction<{ name: string }>): APITokensState => ({
            ...state,
            isLoading: true,
        }),

        setPages: (
            state,
            {
                payload,
            }: PayloadAction<{
                pages: (string | undefined)[]
                currentPage: string | undefined
                nextPage: string | undefined
            }>,
        ): APITokensState => ({
            ...state,
            pages: payload.pages,
            currentPage: payload.currentPage,
            nextPage: payload.nextPage,
        }),

        setItems: (
            state,
            { payload }: PayloadAction<APITokenList>,
        ): APITokensState => {
            let hasNextPage =
                typeof payload.next !== "undefined" && payload.next.length !== 0

            return {
                ...state,
                isLoading: false,
                error: undefined,
                items: payload.items,
                nextPage: payload.next,
                hasNextPage,
            }
        },

        setError: (
            state,
            { payload }: PayloadAction<Error>,
        ): APITokensState => ({
            ...state,
            isLoading: false,
            error: payload,
        }),

        setLastCreatedValue: (
            state,
            { payload }: PayloadAction<string>,
        ): APITokensState => ({
            ...state,
            lastCreatedValue: payload,
        }),
    },

    selectors: {
        allAPITokens: (state) => state.items,
        pages: (state) => state.pages,
        currentPage: (state) => state.currentPage,
        isLoading: (state) => state.isLoading,
        error: (state) => state.error,
        hasPrevPage: (state) => state.pages.length !== 0,
        hasNextPage: (state) => state.hasNextPage,
        lastCreatedValue: (state) => state.lastCreatedValue,
    },
})

export const registerEffects = (startListening: StartListening) => {
    startListening({
        actionCreator: slice.actions.prevPage,
        effect: async (_, { cancelActiveListeners, dispatch, getState }) => {
            cancelActiveListeners()

            let state = {
                pages: slice.selectors.pages(getState()),
                currentPage: slice.selectors.currentPage(getState()),
            }

            if (state.pages.length === 0) {
                return
            }

            let [prevPage, pages] = goBackOnePage(state.pages)

            dispatch(
                slice.actions.setPages({
                    pages,
                    currentPage: prevPage,
                    nextPage: state.currentPage,
                }),
            )

            dispatch(slice.actions.loadPage())
        },
    })

    startListening({
        actionCreator: slice.actions.nextPage,
        effect: async (_, { cancelActiveListeners, dispatch, getState }) => {
            cancelActiveListeners()

            let isLoading = slice.selectors.isLoading(getState())
            if (!isLoading) {
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

            let currentPage = slice.selectors.currentPage(getState())

            try {
                dispatch(
                    slice.actions.setItems(
                        await apiTokensStorage.list({
                            pagination: {
                                after: currentPage,
                                pageSize,
                            },
                            signal,
                        }),
                    ),
                )
            } catch (err) {
                dispatch(slice.actions.setError(err as Error))
                return
            }
        },
    })

    startListening({
        actionCreator: slice.actions.create,
        effect: async (
            { payload },
            { cancelActiveListeners, dispatch, signal },
        ) => {
            cancelActiveListeners()

            try {
                dispatch(
                    slice.actions.setLastCreatedValue(
                        (
                            await apiTokensStorage.create({
                                token: {
                                    name: payload.name,
                                    expiresAt: payload.expiresAt,
                                },
                                signal,
                            })
                        ).token,
                    ),
                )
                dispatch(slice.actions.loadPage())
            } catch (err) {
                dispatch(slice.actions.setError(err as Error))
                return
            }
        },
    })

    startListening({
        actionCreator: slice.actions.del,
        effect: async (
            { payload },
            { cancelActiveListeners, dispatch, getState, signal },
        ) => {
            cancelActiveListeners()

            try {
                await apiTokensStorage.del({
                    name: payload.name,
                    signal,
                })
            } catch (err) {
                dispatch(slice.actions.setError(err as Error))
                return
            }

            let state = {
                currentPage: slice.selectors.currentPage(getState()),
                items: slice.selectors.allAPITokens(getState()),
                pages: slice.selectors.pages(getState()),
            }

            if (state.currentPage === payload.name) {
                if (state.items.length > 1) {
                    let [_, second, ...rest] = state.items
                    dispatch(
                        slice.actions.setPages({
                            pages: state.pages,
                            currentPage: second.name,
                            nextPage:
                                rest.length > 1
                                    ? rest[rest.length - 1].name
                                    : undefined,
                        }),
                    )
                } else if (state.pages.length > 1) {
                    dispatch(slice.actions.prevPage())
                    return
                } else {
                    dispatch(
                        slice.actions.setPages({
                            pages: [],
                            currentPage: undefined,
                            nextPage: undefined,
                        }),
                    )
                }
            }

            dispatch(slice.actions.loadPage())
        },
    })
}
