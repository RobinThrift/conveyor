import { useStore } from "@tanstack/react-store"
import { useCallback, useEffect, useState } from "react"

import { newID } from "@/domain/ID"
import { useAttachmentTransferer } from "@/ui/attachments"
import { type CreateMemoRequest, actions, selectors, stores } from "@/ui/stores"

export function useNewMemoEditorState() {
    let transferAttachment = useAttachmentTransferer()

    let isCreatingMemo = useStore(stores.memos.create.status, selectors.memos.create.isCreatingMemo)
    let tags = useStore(stores.tags.tags)
    let tagsNeedLoading = useStore(stores.tags.state, (state) => typeof state === "undefined")

    useEffect(() => {
        if (tagsNeedLoading) {
            actions.tags.loadTags()
        }
    }, [tagsNeedLoading])

    let vimModeEnabled = useStore(stores.settings.values, selectors.settings.value("controls.vim"))

    let createMemo = useCallback((memo: CreateMemoRequest) => {
        memo.content = memo.content.trim()
        if (memo.content === "") {
            return
        }

        actions.memos.create.createMemo(memo)
    }, [])

    let [newMemo, setNewMemo] = useState({
        id: newID(),
        content: "",
        isArchived: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    })

    useEffect(() => {
        if (!isCreatingMemo) {
            setNewMemo({
                id: newID(),
                content: "",
                isArchived: false,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
        }
    }, [isCreatingMemo])

    return {
        tags,
        createMemo,
        newMemo,
        vimModeEnabled,
        transferAttachment,
    }
}
