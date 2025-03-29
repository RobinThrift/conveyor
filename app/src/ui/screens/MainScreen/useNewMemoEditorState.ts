import { useCallback, useEffect, useState } from "react"

import { newID } from "@/domain/ID"
import { useAttachmentTransferer } from "@/ui/attachments"
import type { CreateMemoRequest } from "@/ui/state/actions"

export type { CreateMemoRequest } from "@/ui/state/actions"

export function useNewMemoEditorState(props: {
    createMemo: (memo: CreateMemoRequest) => void
    inProgress: boolean
}) {
    let transferAttachment = useAttachmentTransferer()

    let createMemo = useCallback(
        (memo: CreateMemoRequest) => {
            memo.content = memo.content.trim()
            if (memo.content === "") {
                return
            }

            props.createMemo(memo)
        },
        [props.createMemo],
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
        if (!props.inProgress) {
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
    }, [props.inProgress])

    return {
        createMemo,
        newMemo,
        transferAttachment,
    }
}
