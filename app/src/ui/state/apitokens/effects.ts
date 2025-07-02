import type { APITokenController } from "@/control/APITokenController"
import { BaseContext } from "@/lib/context"
import type { StartListening } from "@/ui/state/rootStore"

import * as slice from "./index"

const pageSize = 10

export const registerEffects = (
    startListening: StartListening,
    {
        apiTokenCtrl,
    }: {
        apiTokenCtrl: APITokenController
    },
) => {
    startListening({
        actionCreator: slice.actions.loadPage,
        effect: async (_, { cancelActiveListeners, dispatch, signal, getState }) => {
            let state = getState()
            if (slice.selectors.isLoading(state)) {
                return
            }

            cancelActiveListeners()

            dispatch(slice.actions.setLoadingState({ isLoading: true }))

            let currentPage = slice.selectors.currentPage(state)

            let [apitokens, err] = await apiTokenCtrl.listAPITokens(
                BaseContext.withSignal(signal),
                {
                    pagination: {
                        pageSize,
                        after: currentPage,
                    },
                },
            )

            if (err) {
                dispatch(
                    slice.actions.setError({
                        error: err,
                    }),
                )
                return
            }

            if (signal.aborted) {
                return
            }

            dispatch(slice.actions.setAPITokens(apitokens))
            dispatch(slice.actions.setLoadingState({ isLoading: false }))
        },
    })

    startListening({
        actionCreator: slice.actions.nextPage,
        effect: async (_, { cancelActiveListeners, dispatch, getState }) => {
            let state = getState()
            if (slice.selectors.isLoading(state)) {
                return
            }

            let hasNextPage = slice.selectors.hasNextPage(state)
            if (!hasNextPage) {
                return
            }

            cancelActiveListeners()

            dispatch(slice.actions.loadPage())
        },
    })

    startListening({
        actionCreator: slice.actions.previousPage,
        effect: async (_, { cancelActiveListeners, dispatch, getState }) => {
            if (slice.selectors.isLoading(getState())) {
                return
            }

            cancelActiveListeners()

            dispatch(slice.actions.loadPage())
        },
    })

    startListening({
        actionCreator: slice.actions.createAPIToken,
        effect: async ({ payload }, { cancelActiveListeners, dispatch, signal, getState }) => {
            if (slice.selectors.isLoading(getState())) {
                return
            }

            cancelActiveListeners()

            dispatch(slice.actions.setLoadingState({ isLoading: true }))

            let [created, err] = await apiTokenCtrl.createAPIToken(
                BaseContext.withSignal(signal),
                payload,
            )

            if (err) {
                dispatch(
                    slice.actions.setError({
                        error: err,
                    }),
                )
                return
            }

            dispatch(slice.actions.setLastCreatedValue(created.token))
            dispatch(slice.actions.setLoadingState({ isLoading: false }))
            dispatch(slice.actions.loadPage())
        },
    })

    startListening({
        actionCreator: slice.actions.deleteAPIToken,
        effect: async ({ payload }, { cancelActiveListeners, dispatch, signal, getState }) => {
            let state = getState()
            if (slice.selectors.isLoading(state)) {
                return
            }

            cancelActiveListeners()

            dispatch(slice.actions.setLoadingState({ isLoading: true }))

            let [_, err] = await apiTokenCtrl.deleteAPIToken(
                BaseContext.withSignal(signal),
                payload.name,
            )

            if (err) {
                dispatch(
                    slice.actions.setError({
                        error: err,
                    }),
                )
                return
            }

            let apiTokens = slice.selectors.apiTokens(state)
            let pages = slice.selectors.pages(state)

            let isOnlyEntryInPage = apiTokens.length === 1
            let hasPrevPage = pages.length > 1

            if (isOnlyEntryInPage && hasPrevPage) {
                dispatch(slice.actions.setLoadingState({ isLoading: false }))
                dispatch(slice.actions.previousPage())
                return
            }

            dispatch(slice.actions.setLoadingState({ isLoading: false }))
            dispatch(slice.actions.loadPage())
        },
    })
}
