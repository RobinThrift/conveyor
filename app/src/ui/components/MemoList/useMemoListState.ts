import { useStore } from "@tanstack/react-store"
import { useCallback, useMemo } from "react"
import type { Memo, MemoID } from "@/domain/Memo"
import {
    calendarDateFromDate,
    currentDateTime,
    differenceInCalendarDays,
    roundToNearestMinutes,
} from "@/lib/i18n"
import { useNavigation } from "@/ui/navigation"
import { useSetting } from "@/ui/settings"
import { actions, selectors, stores } from "@/ui/stores"

export function useMemoListState() {
    let memos = useStore(stores.memos.list.memos)
    let memosByDay = useMemo(() => groupByDay(memos), [memos])
    let isLoading = useStore(stores.memos.list.state, selectors.memos.list.isLoading)
    let error = useStore(stores.memos.list.error)
    let hasNextPage = useStore(stores.memos.list.nextPage, selectors.memos.list.hasNextPage)
    let isListOutdated = useStore(stores.memos.list.isOutdated)
    let currentPageParams = useStore(
        stores.navigation.currentPage,
        selectors.navigation.currentParams,
    )

    let [layout] = useSetting("ui.memoList.layout")
    let [doubleClickToEdit] = useSetting("controls.doubleClickToEdit")

    let nav = useNavigation()
    let memoActions = useMemo(
        () => ({
            edit: (memoID: MemoID, position?: { x: number; y: number; snippet?: string }) => {
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
                    "edit-memo",
                )
            },
            archive: (memoID: MemoID, isArchived: boolean) => {
                actions.memos.single.updateMemoArchiveStatus(memoID, isArchived)
            },
            delete: (memoID: MemoID, isDeleted: boolean) => {
                actions.memos.single.updateMemoDeleteStatus(memoID, isDeleted)
            },
        }),
        [nav.push],
    )

    let onEOLReached = useCallback(() => {
        if (!isLoading) {
            actions.memos.list.loadNextPage()
        }
    }, [isLoading])

    let reload = useCallback(() => {
        if (!isLoading) {
            actions.memos.list.reload()
        }
    }, [isLoading])

    return {
        memos: memosByDay,
        isLoading,
        error,
        onEOLReached,
        hasNextPage,
        isListOutdated,
        reload,
        memoActions,
        layout,
        doubleClickToEdit,
        focusedMemoID: "memoID" in currentPageParams ? currentPageParams.memoID : undefined,
    }
}

function groupByDay(
    memos: Memo[],
): Record<string, { date: Date; memos: Memo[]; diffToToday: number }> {
    let grouped: Record<string, { date: Date; memos: Memo[]; diffToToday: number }> = {}
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
