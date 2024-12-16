import type { Memo } from "@/domain/Memo"
import { type RootState, actions } from "@/state"
import type {
    CreateMemoRequest,
    Filter,
    UpdateMemoRequest,
} from "@/state/memolist"
import { createSelector } from "@reduxjs/toolkit"
import {
    differenceInCalendarDays,
    format,
    roundToNearestMinutes,
} from "date-fns"
import { useCallback, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"

export type {
    CreateMemoRequest,
    UpdateMemoRequest,
    Filter,
} from "@/state/memolist"

const useMemoListStateSelector = createSelector(
    [
        (state: RootState) => state.memoList.items,
        (state: RootState) => state.memoList.filter,
        (state: RootState) => state.memoList.isLoading,
        (state: RootState) => state.memoList.error,
        (state: RootState) => state.memoList.hasNextPage,
        (state: RootState) => state.tags.items,
        (state: RootState) => state.tags.isLoading,
        (state: RootState) => state.tags.error,
    ],

    (
        memos,
        filter,
        isLoading,
        error,
        hasNextPage,
        tags,
        isLoadingTags,
        tagsError,
    ) => ({
        memos: groupByDay(memos),
        filter,
        isLoading,
        error,
        hasNextPage,
        tags,
        isLoadingTags,
        tagsError,
    }),
)

export function useListMemosPageState() {
    let state = useSelector(useMemoListStateSelector)
    let dispatch = useDispatch()
    let loadPage = useCallback(
        () => dispatch(actions.memoList.loadPage()),
        [dispatch],
    )
    let loadNextPage = useCallback(
        () => dispatch(actions.memoList.nextPage()),
        [dispatch],
    )
    let setFilter = useCallback(
        (f: Filter) => dispatch(actions.memoList.setFilter(f)),
        [dispatch],
    )

    let createMemo = useCallback(
        (memo: CreateMemoRequest) => dispatch(actions.memoList.create(memo)),
        [dispatch],
    )
    let updateMemo = useCallback(
        (memo: UpdateMemoRequest, removeItem: boolean) =>
            dispatch(actions.memoList.update({ memo, removeItem })),
        [dispatch],
    )

    let loadTags = useCallback(
        () => dispatch(actions.tags.loadPage()),
        [dispatch],
    )

    let loadNextTagsPage = useCallback(
        () => dispatch(actions.tags.nextPage()),
        [dispatch],
    )

    return useMemo(
        () => ({
            state,
            actions: {
                loadPage,
                loadNextPage,
                setFilter,
                createMemo,
                updateMemo,
                loadTags,
                loadNextTagsPage,
            },
        }),
        [
            state,
            loadPage,
            loadNextPage,
            setFilter,
            createMemo,
            updateMemo,
            loadTags,
            loadNextTagsPage,
        ],
    )
}

function groupByDay(
    memos: Memo[],
): Record<string, { date: Date; memos: Memo[]; diffToToday: number }> {
    let grouped: Record<
        string,
        { date: Date; memos: Memo[]; diffToToday: number }
    > = {}
    let now = roundToNearestMinutes(new Date())

    memos.forEach((memo) => {
        let day = format(memo.createdAt, "yyyy-mm-dd")
        let diffToToday = differenceInCalendarDays(now, memo.createdAt)
        if (!grouped[day]) {
            grouped[day] = { date: memo.createdAt, memos: [], diffToToday }
        }
        grouped[day].memos.push(memo)
    })

    return grouped
}
