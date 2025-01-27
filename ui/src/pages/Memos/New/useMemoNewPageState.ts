import { createSelector } from "@reduxjs/toolkit"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import { actions } from "@/state"
import { useGoBack } from "@/state/global/router"
import type { CreateMemoRequest } from "@/state/pages/Memos/New/state"
import { selectors } from "@/state/selectors"

export type { CreateMemoRequest } from "@/state/pages/Memos/New/state"

const selectMemoNewPage = createSelector(
    [
        selectors.pages.Memos.New.isLoading,
        selectors.pages.Memos.New.error,
        selectors.entities.Tags.tags,
    ],

    (isLoading, error, tags) => {
        return {
            isLoading: isLoading ?? true,
            error,
            tags: tags,
        }
    },
)

export function useMemoNewPageState() {
    let goBack = useGoBack()

    let state = useSelector(selectMemoNewPage)

    let dispatch = useDispatch()

    let [startedRequest, setStartedRequest] = useState(false)

    useEffect(() => {
        dispatch(actions.entities.Tags.load())
    }, [dispatch])

    let createMemo = useCallback(
        (memo: CreateMemoRequest) => {
            setStartedRequest(true)
            dispatch(actions.pages.Memos.List.create({ memo }))
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
        if (!startedRequest || state.isLoading) {
            return
        }

        if (state.error) {
            setStartedRequest(false)
            return
        }

        goBack({ viewTransition: true, fallback: "/" })
    }, [state.isLoading, state.error, startedRequest, goBack])

    return {
        ...state,
        newMemo,
        createMemo,
        cancelNew,
    }
}
