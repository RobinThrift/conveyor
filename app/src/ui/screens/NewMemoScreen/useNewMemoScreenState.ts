import { useStore } from "@tanstack/react-store"
import { useCallback, useEffect, useMemo, useState } from "react"

import { newID } from "@/domain/ID"
import { useAttachmentTransferer } from "@/ui/attachments"
import { useNavigation } from "@/ui/navigation"
import { actions, type CreateMemoRequest, selectors, stores } from "@/ui/stores"

export function useNewMemoScreenState() {
    let transferAttachment = useAttachmentTransferer()

    let isCreatingMemo = useStore(stores.memos.create.status, selectors.memos.create.isCreatingMemo)
    let error = useStore(stores.memos.create.error)
    let tags = useStore(stores.tags.tags)
    let tagsNeedLoading = useStore(stores.tags.state, (state) => typeof state === "undefined")

    let nav = useNavigation()

    let vimModeEnabled = useStore(stores.settings.values, selectors.settings.value("controls.vim"))

    let [startedRequest, setStartedRequest] = useState(false)

    useEffect(() => {
        if (tagsNeedLoading) {
            actions.tags.loadTags()
        }
    }, [tagsNeedLoading])

    let createMemo = useCallback((memo: CreateMemoRequest) => {
        memo.content = memo.content.trim()
        if (memo.content === "") {
            return
        }

        setStartedRequest(true)
        actions.memos.create.createMemo(memo)
    }, [])

    let cancelNew = useCallback(() => {
        nav.pop()
    }, [nav.pop])

    let newMemo = useMemo(
        () => ({
            id: newID(),
            name: "",
            content: "",
            isArchived: false,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        }),
        [],
    )

    useEffect(() => {
        if (!startedRequest || isCreatingMemo) {
            return
        }

        if (error) {
            setStartedRequest(false)
            return
        }

        nav.pop()
    }, [isCreatingMemo, error, startedRequest, nav.pop])

    return {
        tags,
        isLoading: isCreatingMemo,
        error,
        newMemo,
        settings: {
            vimModeEnabled,
        },
        createMemo,
        cancelNew,
        transferAttachment,
    }
}
