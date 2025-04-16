import { useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { MemoID } from "@/domain/Memo"
import { useNavigation } from "@/ui/navigation"
import { actions, selectors } from "@/ui/state"

export function useSingleMemoScreenState() {
    let isLoading = useSelector(selectors.memos.isLoadingSingleMemo)
    let error = useSelector(selectors.memos.singleMemoError)
    let memo = useSelector(selectors.memos.currentMemo)

    let dispatch = useDispatch()

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

    return {
        isLoading,
        error,
        memo,
        memoActions,
    }
}
