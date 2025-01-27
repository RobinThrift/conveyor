import { createSelector } from "@reduxjs/toolkit"
import { useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { MemoID } from "@/domain/Memo"
import { type UpdateMemoRequest, actions } from "@/state"
import { useGoBack } from "@/state/global/router"
import { selectors } from "@/state/selectors"

const selectMemoEditPage = createSelector(
    [
        selectors.pages.Memos.Edit.memo,
        selectors.pages.Memos.Edit.isLoading,
        selectors.pages.Memos.Edit.error,
        selectors.entities.Tags.tags,
    ],

    (memo, isLoading, error, tags) => {
        return {
            memo,
            isLoading: isLoading ?? true,
            error,
            tags: tags,
        }
    },
)

export function useMemoEditPageState(props: { memoID: MemoID }) {
    let goBack = useGoBack()

    let state = useSelector(selectMemoEditPage)

    let [startedRequest, setStartedRequest] = useState(false)

    let dispatch = useDispatch()

    useEffect(() => {
        dispatch(actions.pages.Memos.Edit.setMemoID({ memoID: props.memoID }))
    }, [dispatch, props.memoID])

    useEffect(() => {
        dispatch(actions.entities.Tags.load())
    }, [dispatch])

    let updateMemo = useCallback(
        ({ memo }: { memo: UpdateMemoRequest }) => {
            setStartedRequest(true)
            dispatch(actions.entities.Memos.update({ memo }))
        },
        [dispatch],
    )

    let cancelEdit = useCallback(() => {
        goBack({ viewTransition: true, fallback: "/" })
    }, [goBack])

    useEffect(() => {
        if (!startedRequest || state.isLoading) {
            return
        }

        if (state.error) {
            setStartedRequest(false)
            return
        }

        goBack({ viewTransition: true, fallback: "/" })
    }, [state.isLoading, state.error, startedRequest, goBack])

    return {
        ...state,
        updateMemo,
        cancelEdit,
    }
}
