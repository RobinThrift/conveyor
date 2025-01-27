import { useCallback, useEffect, useState } from "react"

import type { CreateMemoRequest } from "@/state/pages/Memos/New/state"

export type { CreateMemoRequest } from "@/state/pages/Memos/New/state"

export function useNewMemoEditorState(props: {
    createMemo: (memo: CreateMemoRequest) => void
    inProgress: boolean
}) {
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
        id: Date.now().toString(),
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
                id: Date.now().toString(),
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
    }
}
