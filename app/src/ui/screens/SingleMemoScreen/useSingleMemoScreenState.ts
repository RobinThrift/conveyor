import { useEffect, useMemo, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { MemoID } from "@/domain/Memo"
import { useIsMobile } from "@/ui/hooks/useIsMobile"
import { useNavigation } from "@/ui/navigation"
import { actions, selectors } from "@/ui/state"

export function useSingleMemoScreenState() {
    let isLoading = useSelector(selectors.memos.isLoadingSingleMemo)
    let error = useSelector(selectors.memos.singleMemoError)
    let memo = useSelector(selectors.memos.currentMemo)
    let ref = useRef<HTMLDivElement | null>(null)

    let dispatch = useDispatch()

    let isMobile = useIsMobile()

    useEffect(() => {
        if (!isMobile) {
            return
        }

        let raf: ReturnType<typeof requestAnimationFrame> | undefined

        let onscroll = () => {
            if (raf) {
                cancelAnimationFrame(raf)
            }

            let height = ref.current?.getBoundingClientRect().height ?? 0
            let scrollPos = window.scrollY
            raf = requestAnimationFrame(() => {
                let progress = Math.max(
                    Math.min(scrollPos / (height || 1), 1),
                    0,
                )

                document.documentElement.style.setProperty(
                    "--memo-scroll-progress",
                    progress.toPrecision(2),
                )
            })
        }

        window.addEventListener("scroll", onscroll, { passive: true })

        return () => {
            if (raf) {
                cancelAnimationFrame(raf)
            }
            window.removeEventListener("scroll", onscroll)
            document.documentElement.style.removeProperty(
                "--memo-scroll-progress",
            )
        }
    }, [isMobile])

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
                    "edit-memo",
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
        ref,
        isLoading,
        error,
        memo,
        memoActions,
    }
}
