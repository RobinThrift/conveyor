import { useCallback, useEffect, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { Memo, MemoID } from "@/domain/Memo"
import { actions } from "@/state"
import type { UpdateMemoRequest } from "@/state/entities/memos"
import { useGoto } from "@/state/global/router"
import type { CreateMemoRequest, Filter } from "@/state/pages/Memos/List/state"
import { selectors } from "@/state/selectors"
import { createSelector } from "@reduxjs/toolkit"

export type { UpdateMemoRequest } from "@/state/entities/memos"
export type { Filter, CreateMemoRequest } from "@/state/pages/Memos/List/state"

const selectMemoListPageState = createSelector(
    [
        selectors.entities.Memos.allMemos,
        selectors.pages.Memos.List.memosInList,
        selectors.pages.Memos.List.filter,
        selectors.pages.Memos.List.isLoadingMemos,
        selectors.pages.Memos.List.error,
        selectors.pages.Memos.List.hasNextPage,
        selectors.pages.Memos.List.isCreatingMemo,
        selectors.entities.Tags.tags,
    ],

    (
        memoEntities,
        memosInList,
        filter,
        isLoading,
        error,
        hasNextPage,
        isCreatingMemo,
        tags,
    ) => {
        let memos: Memo[] = []

        memosInList.forEach((id) => {
            memos.push(memoEntities[id])
        })

        return {
            memos: memos,
            filter,
            isLoading,
            error,
            hasNextPage,
            isCreatingMemo,
            tags,
        }
    },
)

export function useMemosListPageState(props: {
    filter: Filter
    onChangeFilters?: (filter: Filter) => void
}) {
    let state = useSelector(selectMemoListPageState)
    let dispatch = useDispatch()

    let loadPage = useCallback(
        () => dispatch(actions.pages.Memos.List.loadPage()),
        [dispatch],
    )

    let loadNextPage = useCallback(
        () => dispatch(actions.pages.Memos.List.nextPage()),
        [dispatch],
    )

    let createMemo = useCallback(
        (memo: CreateMemoRequest) =>
            dispatch(actions.pages.Memos.List.create({ memo })),
        [dispatch],
    )

    let updateMemo = useCallback(
        (memo: UpdateMemoRequest) =>
            dispatch(actions.entities.Memos.update({ memo })),
        [dispatch],
    )

    useEffect(() => {
        dispatch(actions.entities.Tags.load())
    }, [dispatch])

    useEffect(() => {
        dispatch(actions.pages.Memos.List.setFilter(props.filter))
    }, [dispatch, props.filter])

    useEffect(() => {
        if (
            Object.keys(props.filter).length === 0 &&
            state.memos.length === 0
        ) {
            dispatch(actions.pages.Memos.List.loadPage())
        }
    }, [dispatch, props.filter, state.memos.length])

    let onEOLReached = useCallback(() => {
        if (!state.isLoading) {
            dispatch(actions.pages.Memos.List.nextPage())
        }
    }, [state.isLoading, dispatch])

    let setFilter = useCallback(
        (filter: Filter) => {
            if (props.onChangeFilters) {
                props.onChangeFilters(filter)
                return
            }

            dispatch(actions.pages.Memos.List.setFilter(filter))
        },
        [props.onChangeFilters, dispatch],
    )

    let goto = useGoto()

    let memoActions = useMemo(
        () => ({
            edit: (
                memoID: MemoID,
                position?: { x: number; y: number; snippet?: string },
            ) => {
                let url = `/memos/${memoID}/edit`
                if (position) {
                    url = `${url}?x=${position.x}&y=${position.y}&snippet=${position.snippet}`
                }
                goto(url)
            },
            archive: (memoID: MemoID, isArchived: boolean) => {
                dispatch(
                    actions.entities.Memos.update({
                        memo: { id: memoID, isArchived },
                    }),
                )
            },
            delete: (memoID: MemoID, isDeleted: boolean) => {
                dispatch(
                    actions.entities.Memos.update({
                        memo: { id: memoID, isDeleted },
                    }),
                )
            },
        }),
        [dispatch, goto],
    )

    return useMemo(
        () => ({
            ...state,
            loadPage,
            loadNextPage,
            createMemo,
            updateMemo,
            setFilter,
            onEOLReached,
            memoActions,
        }),
        [
            state,
            loadPage,
            loadNextPage,
            setFilter,
            createMemo,
            updateMemo,
            onEOLReached,
            memoActions,
        ],
    )
}
