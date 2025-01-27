import { createSelector } from "@reduxjs/toolkit"
import { useEffect, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { MemoID } from "@/domain/Memo"
import { type RootState, actions } from "@/state"
import { useGoto } from "@/state/global/router"
import { selectors } from "@/state/selectors"

const selectMemoSinglePage = createSelector(
    [
        selectors.pages.Memos.Single.memo,
        selectors.pages.Memos.Single.isLoading,
        selectors.pages.Memos.Single.error,
    ],

    (memo, isLoading, error) => {
        return {
            memo,
            isLoading: isLoading ?? true,
            error,
        }
    },
)

export function useMemoSinglePageState(props: { memoID: MemoID }) {
    let state = useSelector((state: RootState) => selectMemoSinglePage(state))

    let dispatch = useDispatch()

    useEffect(() => {
        dispatch(actions.pages.Memos.Single.setMemoID({ memoID: props.memoID }))
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
                    actions.entities.Memos.update({
                        memo: { id: memoID, isArchived },
                    }),
                )
            },
            delete: (memoID: MemoID, isDeleted: boolean) => {
                dispatch(
                    actions.entities.Memos.update({
                        memo: { id: memoID, isDeleted },
                    }),
                )
            },
        }),
        [dispatch, goto],
    )

    return {
        ...state,
        memoActions,
    }
}
