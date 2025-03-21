import { useCallback, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import { type CreateAPITokenRequest, actions, selectors } from "@/ui/state"

export type { CreateAPITokenRequest } from "@/ui/state"

export function useAPITokensTabState() {
    let dispatch = useDispatch()

    let isLoading = useSelector(selectors.apitokens.isLoading)
    let error = useSelector(selectors.apitokens.error)
    let lastCreatedValue = useSelector(selectors.apitokens.lastCreatedValue)
    let apiTokens = useSelector(selectors.apitokens.apiTokens)
    let hasNextPage = useSelector(selectors.apitokens.hasNextPage)
    let hasPreviousPage = useSelector(selectors.apitokens.hasPreviousPage)

    let loadPrevPage = useCallback(
        () => dispatch(actions.apitokens.previousPage()),
        [dispatch],
    )

    let loadNextPage = useCallback(
        () => dispatch(actions.apitokens.nextPage()),
        [dispatch],
    )

    let createAPIToken = useCallback(
        (req: CreateAPITokenRequest) => {
            dispatch(actions.apitokens.createAPIToken(req))
        },
        [dispatch],
    )

    let deleteAPIToken = useCallback(
        (name: string) => {
            dispatch(actions.apitokens.deleteAPIToken({ name }))
        },
        [dispatch],
    )

    useEffect(() => {
        dispatch(actions.apitokens.loadPage())
    }, [dispatch])

    return {
        apiTokens,
        hasNextPage,
        hasPreviousPage,
        loadPrevPage,
        loadNextPage,
        isLoading,
        error,
        lastCreatedValue,
        createAPIToken,
        deleteAPIToken,
    }
}
