import { createSelector } from "@reduxjs/toolkit"
import { useCallback, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { Memo, MemoID } from "@/domain/Memo"
import {
    calendarDateFromDate,
    currentDateTime,
    differenceInCalendarDays,
    roundToNearestMinutes,
} from "@/lib/i18n"
import { useNavigation } from "@/ui/navigation"
import { useSetting } from "@/ui/settings"
import { actions, selectors } from "@/ui/state"

export function useMemoListState() {
    let dispatch = useDispatch()

    let memos = useSelector(groupMemosByDaySelector)
    let isLoading = useSelector(selectors.memos.isLoading)
    let error = useSelector(selectors.memos.error)
    let hasNextPage = useSelector(selectors.memos.hasNextPage)
    let currentPageParams = useSelector(selectors.navigation.currentParams)

    let [layout] = useSetting("ui.memoList.layout")
    let [doubleClickToEdit] = useSetting("controls.doubleClickToEdit")

    let nav = useNavigation()
    let memoActions = useMemo(
        () => ({
            edit: (
                memoID: MemoID,
                position?: { x: number; y: number; snippet?: string },
            ) => {
                nav.push(
                    "memo.edit",
                    {
                        memoID,
                        isEditing: true,
                        editPosition: position,
                    },
                    {
                        scrollOffsetTop: Math.ceil(
                            window.visualViewport?.pageTop ?? window.scrollY,
                        ),
                    },
                )
            },
            archive: (memoID: MemoID, isArchived: boolean) => {
                dispatch(
                    actions.memos.update({
                        memo: { id: memoID, isArchived },
                    }),
                )
            },
            delete: (memoID: MemoID, isDeleted: boolean) => {
                dispatch(
                    actions.memos.update({
                        memo: { id: memoID, isDeleted },
                    }),
                )
            },
        }),
        [dispatch, nav.push],
    )

    let onEOLReached = useCallback(() => {
        if (!isLoading) {
            dispatch(actions.memos.nextPage())
        }
    }, [isLoading, dispatch])

    return {
        memos,
        isLoading,
        error,
        onEOLReached,
        hasNextPage,
        memoActions,
        layout,
        doubleClickToEdit,
        focusedMemoID:
            "memoID" in currentPageParams
                ? currentPageParams.memoID
                : undefined,
    }
}

const groupMemosByDaySelector = createSelector(
    [(state) => selectors.memos.memos(state)],
    (memos) => groupByDay(memos),
)

function groupByDay(
    memos: Memo[],
): Record<string, { date: Date; memos: Memo[]; diffToToday: number }> {
    let grouped: Record<
        string,
        { date: Date; memos: Memo[]; diffToToday: number }
    > = {}
    let now = roundToNearestMinutes(currentDateTime())

    memos.forEach((memo) => {
        let day = calendarDateFromDate(memo.createdAt).toString()
        let diffToToday = differenceInCalendarDays(memo.createdAt, now)
        if (!grouped[day]) {
            grouped[day] = { date: memo.createdAt, memos: [], diffToToday }
        }
        grouped[day].memos.push(memo)
    })

    return grouped
}
