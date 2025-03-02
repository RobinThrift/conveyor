import { useEffect, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { MemoID } from "@/domain/Memo"
import { actions, selectors } from "@/ui/state"
import { useGoto } from "@/ui/state/global/router"

export function useSingleMemoScreenState(props: { memoID: MemoID }) {
    let isLoading = useSelector(selectors.memos.isLoadingSingleMemo)
    let error = useSelector(selectors.memos.singleMemoError)
    let memo = useSelector(selectors.memos.currentMemo)

    let dispatch = useDispatch()

    useEffect(() => {
        dispatch(actions.memos.setCurrentSingleMemoID({ id: props.memoID }))
    }, [dispatch, props.memoID])

    let goto = useGoto()
    let memoActions = useMemo(
        () => ({
            edit: (
                memoID: MemoID,
                position?: { x: number; y: number; snippet?: string },
            ) => {
                let url = `/memos/${memoID}/edit`
                let params: URLSearchParams | undefined
                if (position) {
                    params = new URLSearchParams({
                        x: position.x.toString(),
                        y: position.y.toString(),
                    })
                    if (position.snippet) {
                        params.set("snippet", position.snippet)
                    }
                }
                goto(url, params)
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
        isLoading,
        error,
        memo,
        memoActions,
    }
}
