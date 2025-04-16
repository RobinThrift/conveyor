import { useCallback, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import { type Filter, actions, selectors } from "@/ui/state"

export function useMemoListScreenState() {
    let filter = useSelector(selectors.memos.filter)
    let tags = useSelector(selectors.tags.tags)
    let dispatch = useDispatch()

    useEffect(() => {
        dispatch(actions.tags.loadTags())
    }, [dispatch])

    let setFilter = useCallback(
        (filter: Filter) => {
            dispatch(
                actions.memos.setFilter({
                    filter,
                    source: "user",
                }),
            )
        },
        [dispatch],
    )

    return {
        filter,
        tags,
        setFilter,
        showEditor: true,
    }
}
