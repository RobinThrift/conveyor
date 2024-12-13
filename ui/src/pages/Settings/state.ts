import { type RootState, actions } from "@/state"
import { createSelector } from "@reduxjs/toolkit"
import { useCallback, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"

const apiTokensSelector = createSelector(
    [
        (state: RootState) => state.apiTokens.isLoading,
        (state: RootState) => state.apiTokens.error,
        (state: RootState) => state.apiTokens.items,
        (state: RootState) => state.apiTokens.lastCreatedValue,
        (state: RootState) => state.apiTokens.pages.length !== 0,
        (state: RootState) => state.apiTokens.hasNextPage,
    ],
    (
        isLoading,
        error,
        apiTokens,
        lastCreatedValue,
        hasPrevPage,
        hasNextPage,
    ) => ({
        isLoading,
        error,
        apiTokens,
        lastCreatedValue,
        hasPrevPage,
        hasNextPage,
    }),
)

export function useSystemSettingsTabState() {
    let state = useSelector(apiTokensSelector)
    let dispatch = useDispatch()
    let loadPage = useCallback(
        () => dispatch(actions.apiTokens.loadPage()),
        [dispatch],
    )
    let loadPrevPage = useCallback(
        () => dispatch(actions.apiTokens.prevPage()),
        [dispatch],
    )
    let loadNextPage = useCallback(
        () => dispatch(actions.apiTokens.nextPage()),
        [dispatch],
    )

    let create = useCallback(
        (token: { name: string; expiresAt: Date }) =>
            dispatch(actions.apiTokens.create(token)),
        [dispatch],
    )

    let del = useCallback(
        (name: string) => dispatch(actions.apiTokens.del({ name })),
        [dispatch],
    )

    return useMemo(
        () => ({
            state,
            actions: {
                loadPage,
                loadPrevPage,
                loadNextPage,
                create,
                del,
            },
        }),
        [state, loadPage, loadPrevPage, loadNextPage, create, del],
    )
}
