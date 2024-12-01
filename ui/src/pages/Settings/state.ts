import { apiTokensStore } from "@/storage/apitokens"
import { useStore } from "@nanostores/react"
import { batched } from "nanostores"
import { useMemo } from "react"

export function useSystemSettingsTabState() {
    let $store = useMemo(
        () =>
            batched(
                [
                    apiTokensStore.$tokens,
                    apiTokensStore.$isLoading,
                    apiTokensStore.$error,
                    apiTokensStore.$hasPreviousPage,
                    apiTokensStore.$hasNextPage,
                    apiTokensStore.$lastCreatedValue,
                ],
                (
                    tokens,
                    isLoading,
                    error,
                    hasPreviousPage,
                    hasNextPage,
                    lastCreatedValue,
                ) => ({
                    tokens,
                    isLoading,
                    error,
                    hasPreviousPage,
                    hasNextPage,
                    lastCreatedValue,
                    create: apiTokensStore.create,
                    loadPrevPage: apiTokensStore.loadPrevPage,
                    loadNextPage: apiTokensStore.loadNextPage,
                    del: apiTokensStore.del,
                }),
            ),
        [],
    )

    return useStore($store)
}
