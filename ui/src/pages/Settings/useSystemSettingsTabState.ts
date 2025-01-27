import { actions } from "@/state"
import { selectors } from "@/state/selectors"
import { useCallback, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

export function useSystemSettingsTabState() {
    let apiTiokens = useSelector(
        selectors.pages.Settings.SystemSettingsTab.apiTokens,
    )
    let dispatch = useDispatch()

    let loadPrevPage = useCallback(
        () => dispatch(actions.entities.apiTokens.prevPage()),
        [dispatch],
    )

    let loadNextPage = useCallback(
        () => dispatch(actions.entities.apiTokens.nextPage()),
        [dispatch],
    )

    let createAPIToken = useCallback(
        (token: { name: string; expiresAt: Date }) =>
            dispatch(actions.entities.apiTokens.create(token)),
        [dispatch],
    )

    let deleteAPIToken = useCallback(
        (name: string) => dispatch(actions.entities.apiTokens.del({ name })),
        [dispatch],
    )

    useEffect(() => {
        dispatch(actions.entities.apiTokens.loadPage())
    }, [dispatch])

    return {
        ...apiTiokens,
        loadPrevPage,
        loadNextPage,
        createAPIToken,
        deleteAPIToken,
    }
}
