import { createSelector } from "@reduxjs/toolkit"
import { useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { MemoID } from "@/domain/Memo"
import { useAttachmentTransferer } from "@/ui/attachments"
import { type UpdateMemoRequest, actions, selectors } from "@/ui/state"
import { useGoBack } from "@/ui/state/global/router"

export type { UpdateMemoRequest } from "@/ui/state"

const settingsSelector = createSelector(
    [(state) => selectors.settings.value(state, "controls.vim")],
    (vimModeEnabled) => ({ vimModeEnabled }),
)

export function useEditMemoScreenState(props: { memoID: MemoID }) {
    let transferAttachment = useAttachmentTransferer()

    let tags = useSelector(selectors.tags.tags)
    let isUpdatingMemo = useSelector(selectors.memos.isUpdatingMemo)
    let isLoadingMemo = useSelector(selectors.memos.isLoadingSingleMemo)
    let updateMemoError = useSelector(selectors.memos.updateMemoError)
    let singleMemoError = useSelector(selectors.memos.singleMemoError)
    let memo = useSelector(selectors.memos.currentMemo)

    let isLoading = isUpdatingMemo || isLoadingMemo
    let error = updateMemoError ?? singleMemoError

    let settings = useSelector(settingsSelector)

    let goBack = useGoBack()

    let [startedRequest, setStartedRequest] = useState(false)

    let dispatch = useDispatch()

    useEffect(() => {
        dispatch(actions.memos.setCurrentSingleMemoID({ id: props.memoID }))
    }, [dispatch, props.memoID])

    useEffect(() => {
        dispatch(actions.tags.loadTags())
    }, [dispatch])

    let updateMemo = useCallback(
        ({ memo }: { memo: UpdateMemoRequest }) => {
            setStartedRequest(true)
            dispatch(actions.memos.update({ memo }))
        },
        [dispatch],
    )

    let cancelEdit = useCallback(() => {
        goBack({ viewTransition: true, fallback: "/" })
    }, [goBack])

    useEffect(() => {
        if (!startedRequest || isLoading) {
            return
        }

        if (error) {
            setStartedRequest(false)
            return
        }

        goBack({ viewTransition: true, fallback: "/" })
    }, [isLoading, error, startedRequest, goBack])

    return {
        memo,
        tags,
        isLoading,
        error,
        settings,
        updateMemo,
        cancelEdit,
        transferAttachment,
    }
}
