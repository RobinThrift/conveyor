import { createSelector } from "@reduxjs/toolkit"
import { useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import { newID } from "@/domain/ID"
import { useAttachmentTransferer } from "@/ui/attachments"
import { actions, selectors } from "@/ui/state"
import type { CreateMemoRequest } from "@/ui/state/actions"

export type { CreateMemoRequest } from "@/ui/state/actions"

const settingsSelector = createSelector(
    [(state) => selectors.settings.value(state, "controls.vim")],
    (vimModeEnabled) => ({ vimModeEnabled }),
)

export function useNewMemoEditorState() {
    let dispatch = useDispatch()

    let transferAttachment = useAttachmentTransferer()

    let isCreatingMemo = useSelector(selectors.memos.isCreatingMemo)
    let tags = useSelector(selectors.tags.tags)

    let settings = useSelector(settingsSelector)

    let createMemo = useCallback(
        (memo: CreateMemoRequest) => {
            memo.content = memo.content.trim()
            if (memo.content === "") {
                return
            }

            dispatch(actions.memos.create({ memo }))
        },
        [dispatch],
    )

    let [newMemo, setNewMemo] = useState({
        id: newID(),
        name: "",
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
                name: "",
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
        settings,
        transferAttachment,
    }
}
