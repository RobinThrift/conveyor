import { useStore } from "@tanstack/react-store"
import { useCallback, useEffect, useState } from "react"

import type { MemoContentChanges } from "@/domain/Changelog"
import type { MemoID } from "@/domain/Memo"
import { useAttachmentTransferer } from "@/ui/attachments"
import { useNavigation } from "@/ui/navigation"
import { actions, selectors, stores } from "@/ui/stores"

export type UpdateMemoConrentRequest = {
    id: MemoID
    content?: {
        content: string
        changes: MemoContentChanges
    }
}

export function useEditMemoScreenState() {
    let transferAttachment = useAttachmentTransferer()

    let isLoading = useStore(stores.memos.single.status, selectors.memos.single.isLoading)
    let error = useStore(stores.memos.single.error)
    let memo = useStore(stores.memos.single.memo)

    let tags = useStore(stores.tags.tags)
    let tagsNeedLoading = useStore(stores.tags.state, (state) => typeof state === "undefined")

    let settings = useStore(stores.settings.values, (state) => ({
        vimModeEnabled: state.controls.vim,
    }))

    let nav = useNavigation()

    let [startedRequest, setStartedRequest] = useState(false)

    useEffect(() => {
        if (tagsNeedLoading) {
            actions.tags.loadTags()
        }
    }, [tagsNeedLoading])

    let updateMemo = useCallback((req: UpdateMemoConrentRequest) => {
        setStartedRequest(true)
        actions.memos.single.updateMemoContent({
            id: req.id,
            content: req.content,
        })
    }, [])

    let cancelEdit = useCallback(() => {
        let memoID = memo?.id
        nav.popStack().then(() => {
            if (memoID) {
                nav.push("memo.view", { memoID }, { scrollOffsetTop: 0 })
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

    let currentPageParams = useStore(stores.navigation.currentParams)

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
