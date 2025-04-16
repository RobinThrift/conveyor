import { useCallback, useEffect, useMemo, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import { newID } from "@/domain/ID"
import { useAttachmentTransferer } from "@/ui/attachments"
import { useNavigation } from "@/ui/navigation"
import { type CreateMemoRequest, actions, selectors } from "@/ui/state"

export type { CreateMemoRequest } from "@/ui/state/actions"

export function useNewMemoScreenState() {
    let transferAttachment = useAttachmentTransferer()

    let tags = useSelector(selectors.tags.tags)
    let error = useSelector(selectors.memos.createMemoError)
    let isLoading = useSelector(selectors.memos.isCreatingMemo)

    let dispatch = useDispatch()
    let nav = useNavigation()

    let [startedRequest, setStartedRequest] = useState(false)

    useEffect(() => {
        dispatch(actions.tags.loadTags())
    }, [dispatch])

    let createMemo = useCallback(
        (memo: CreateMemoRequest) => {
            setStartedRequest(true)
            dispatch(actions.memos.create({ memo }))
        },
        [dispatch],
    )

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
        if (!startedRequest || isLoading) {
            return
        }

        if (error) {
            setStartedRequest(false)
            return
        }

        nav.pop()
    }, [isLoading, error, startedRequest, nav.pop])

    return {
        tags,
        isLoading,
        error,
        newMemo,
        createMemo,
        cancelNew,
        transferAttachment,
    }
}
