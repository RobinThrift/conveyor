import { useCallback, useEffect, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { MemoID } from "@/domain/Memo"
import { actions, selectors } from "@/ui/state"
import type {
    CreateMemoRequest,
    Filter,
    UpdateMemoRequest,
} from "@/ui/state/actions"
import { useGoto } from "@/ui/state/global/router"

export type {
    UpdateMemoRequest,
    Filter,
    CreateMemoRequest,
} from "@/ui/state/actions"

export function useMainScreenState(props: {
    filter: Filter
    onChangeFilter?: (filter: Filter) => void
}) {
    let memos = useSelector(selectors.memos.memos)
    let filter = useSelector(selectors.memos.filter)
    let isLoading = useSelector(selectors.memos.isLoading)
    let error = useSelector(selectors.memos.error)
    let hasNextPage = useSelector(selectors.memos.hasNextPage)
    let tags = useSelector(selectors.tags.tags)
    let isCreatingMemo = useSelector(selectors.memos.isCreatingMemo)
    let dispatch = useDispatch()

    // let loadPage = useCallback(
    //     () => dispatch(actions.memos.nextPage()),
    //     [dispatch],
    // )

    let loadNextPage = useCallback(
        () => dispatch(actions.memos.nextPage()),
        [dispatch],
    )

    let createMemo = useCallback(
        (memo: CreateMemoRequest) => dispatch(actions.memos.create({ memo })),
        [dispatch],
    )

    let updateMemo = useCallback(
        (memo: UpdateMemoRequest) => dispatch(actions.memos.update({ memo })),
        [dispatch],
    )

    useEffect(() => {
        dispatch(actions.tags.loadTags())
    }, [dispatch])

    useEffect(() => {
        dispatch(actions.memos.setFilter(props.filter))
    }, [dispatch, props.filter])

    // useEffect(() => {
    //     if (
    //         Object.keys(props.filter).length === 0 &&
    //         memos.length === 0
    //     ) {
    //         dispatch(actions.memos.List.loadPage())
    //     }
    // }, [dispatch, props.filter, memos.length])

    let onEOLReached = useCallback(() => {
        if (!isLoading) {
            dispatch(actions.memos.nextPage())
        }
    }, [isLoading, dispatch])

    let setFilter = useCallback(
        (filter: Filter) => {
            if (props.onChangeFilter) {
                props.onChangeFilter(filter)
                return
            }

            dispatch(actions.memos.setFilter(filter))
        },
        [props.onChangeFilter, dispatch],
    )

    let goto = useGoto()

    let memoActions = useMemo(
        () => ({
            edit: (
                memoID: MemoID,
                position?: { x: number; y: number; snippet?: string },
            ) => {
                let url = `/memos/${memoID}/edit`
                if (position) {
                    url = `${url}?x=${position.x}&y=${position.y}&snippet=${position.snippet}`
                }
                goto(url)
            },
            archive: (memoID: MemoID, isArchived: boolean) => {
                dispatch(
                    actions.memos.update({
                        memo: { id: memoID, isArchived },
                    }),
                )
            },
            delete: (memoID: MemoID, isDeleted: boolean) => {
                dispatch(
                    actions.memos.update({
                        memo: { id: memoID, isDeleted },
                    }),
                )
            },
        }),
        [dispatch, goto],
    )

    return {
        memos,
        filter,
        isLoading,
        error,
        loadNextPage,
        tags,
        hasNextPage,
        setFilter,
        onEOLReached,
        memoActions,
        createMemo,
        isCreatingMemo,
        updateMemo,
    }
}
