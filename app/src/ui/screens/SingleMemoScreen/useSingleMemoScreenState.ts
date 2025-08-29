import { useStore } from "@tanstack/react-store"
import { useMemo, useRef } from "react"

import type { MemoID } from "@/domain/Memo"
import { useNavigation } from "@/ui/navigation"
import { actions, selectors, stores } from "@/ui/stores"

export function useSingleMemoScreenState() {
    let isLoading = useStore(stores.memos.single.status, selectors.memos.single.isLoading)
    let error = useStore(stores.memos.single.error)
    let memo = useStore(stores.memos.single.memo)
    let ref = useRef<HTMLDivElement | null>(null)

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
            archive: actions.memos.single.updateMemoArchiveStatus,
            delete: actions.memos.single.updateMemoDeleteStatus,
        }),
        [nav.push],
    )

    return {
        ref,
        isLoading,
        error,
        memo,
        memoActions,
    }
}
