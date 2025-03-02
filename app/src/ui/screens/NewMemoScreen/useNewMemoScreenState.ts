import { useCallback, useEffect, useMemo, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import { useAttachmentTransferer } from "@/ui/attachments"
import { type CreateMemoRequest, actions, selectors } from "@/ui/state"
import { useGoBack } from "@/ui/state/global/router"

export type { CreateMemoRequest } from "@/ui/state/actions"

export function useNewMemoScreenState() {
    let transferAttachment = useAttachmentTransferer()

    let tags = useSelector(selectors.tags.tags)
    let error = useSelector(selectors.memos.createMemoError)
    let isLoading = useSelector(selectors.memos.isCreatingMemo)

    let goBack = useGoBack()

    let dispatch = useDispatch()

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
        goBack({ viewTransition: true, fallback: "/" })
    }, [goBack])

    let newMemo = useMemo(
        () => ({
            id: Date.now().toString(),
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

        goBack({ viewTransition: true, fallback: "/" })
    }, [isLoading, error, startedRequest, goBack])

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
