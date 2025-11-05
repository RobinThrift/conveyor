import { useStore } from "@tanstack/react-store"
import { useCallback } from "react"
import { useSetting } from "@/ui/settings"
import { actions, selectors, stores } from "@/ui/stores"

export function useMemoListState() {
    let items = useStore(stores.memos.list.items)
    let isLoading = useStore(stores.memos.list.state, selectors.memos.list.isLoading)
    let error = useStore(stores.memos.list.error)
    let hasNextPage = useStore(stores.memos.list.nextPage, selectors.memos.list.hasNextPage)
    let isListOutdated = useStore(stores.memos.list.isOutdated)

    let [doubleClickToEdit] = useSetting("controls.doubleClickToEdit")

    let onEOLReached = useCallback(() => {
        if (!isLoading) {
            actions.memos.list.loadNextPage()
        }
    }, [isLoading])

    let reload = useCallback(() => {
        if (!isLoading) {
            actions.memos.list.reload()
        }
    }, [isLoading])

    return {
        items,
        isLoading,
        error,
        onEOLReached,
        hasNextPage,
        isListOutdated,
        reload,
        doubleClickToEdit,
    }
}
