import { createSelector } from "@reduxjs/toolkit"
import { useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import { useAttachmentTransferer } from "@/ui/attachments"
import { useNavigation } from "@/ui/navigation"
import { type UpdateMemoRequest, actions, selectors } from "@/ui/state"

export type { UpdateMemoRequest } from "@/ui/state"
const settingsSelector = createSelector(
    [(state) => selectors.settings.value(state, "controls.vim")],
    (vimModeEnabled) => ({ vimModeEnabled }),
)

export function useEditMemoScreenState() {
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

    let nav = useNavigation()

    let [startedRequest, setStartedRequest] = useState(false)

    let dispatch = useDispatch()

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
        let memoID = memo?.id
        nav.popStack().then(() => {
            if (memoID) {
                nav.push("memo.view", { memoID }, { scrollOffsetTop: 0 }, "single-memo")
            }
        })
    }, [nav.popStack, nav.push, memo?.id])

    useEffect(() => {
        if (!startedRequest || isLoading) {
            return
        }

        if (error) {
            setStartedRequest(false)
            return
        }

        nav.pop()
    }, [isLoading, error, startedRequest, nav.pop])

    let currentPageParams = useSelector(selectors.navigation.currentParams)

    return {
        memo,
        tags,
        isLoading,
        error,
        settings,
        placeCursorAt:
            "editPosition" in currentPageParams ? currentPageParams.editPosition : undefined,
        updateMemo,
        cancelEdit,
        transferAttachment,
    }
}
