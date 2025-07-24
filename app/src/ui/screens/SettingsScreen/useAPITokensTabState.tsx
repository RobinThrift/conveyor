import { useStore } from "@tanstack/react-store"
import { useCallback, useEffect } from "react"

import { actions, selectors, stores } from "@/ui/stores"

export function useAPITokensTabState() {
    let firstLoad = useStore(stores.apitokens.status, (state) => typeof state === "undefined")

    let isLoading = useStore(
        stores.apitokens.status,
        (state) => state === "loading" || state === "page-requested",
    )
    let error = useStore(stores.apitokens.error)
    let lastCreatedValue = useStore(stores.apitokens.lastCreated)
    let apiTokens = useStore(stores.apitokens.tokens)
    let hasNextPage = useStore(stores.apitokens.pagination, selectors.apitokens.hasNextPage)
    let hasPreviousPage = useStore(stores.apitokens.pagination, selectors.apitokens.hasPreviousPage)

    let loadPrevPage = useCallback(() => actions.apitokens.previousPage(), [])

    let loadNextPage = useCallback(() => actions.apitokens.nextPage(), [])

    let createAPIToken = useCallback(
        (req: {
            name: string
            expiresAt: Date
        }) => {
            actions.apitokens.createAPIToken(req)
        },
        [],
    )

    let deleteAPIToken = useCallback((name: string) => {
        actions.apitokens.deleteAPIToken(name)
    }, [])

    useEffect(() => {
        if (firstLoad) {
            actions.apitokens.loadPage()
        }
    }, [firstLoad])

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
