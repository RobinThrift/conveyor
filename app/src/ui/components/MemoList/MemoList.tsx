import clsx from "clsx"
import React, { useEffect, useRef } from "react"

import { EndOfListMarker } from "@/ui/components/EndOfListMarker"
import { Loader } from "@/ui/components/Loader"
import { Memo } from "@/ui/components/Memo"
import { useIsMobile } from "@/ui/hooks/useIsMobile"

import { DayHeader } from "./DayHeader"
import { LayoutSelect } from "./LayoutSelect"
import { ReloadButton } from "./ReloadButton"
import { useMemoListState } from "./useMemoListState"

export interface MemoListProps {
    className?: string
}

export function MemoList(props: MemoListProps) {
    let {
        memos,
        isLoading,
        onEOLReached,
        memoActions,
        focusedMemoID,
        layout,
        reload,
        isListOutdated,
        doubleClickToEdit,
    } = useMemoListState()

    let ref = useRef<HTMLDivElement>(null)

    let isMobile = useIsMobile()

    // biome-ignore lint/correctness/useExhaustiveDependencies: this is intentional
    useEffect(() => {
        if (!ref.current || !focusedMemoID || isMobile) {
            return
        }

        requestAnimationFrame(() => {
            let el = ref.current?.querySelector(`#memo-${focusedMemoID}`)
            el?.scrollIntoView({ behavior: "instant", block: "start" })
        })
    }, [ref.current?.querySelector(`#memo-${focusedMemoID}`), focusedMemoID, isMobile])

    return (
        <div className={clsx("memo-list", `list-layout-${layout}`, props.className)} ref={ref}>
            {isListOutdated ? <ReloadButton reload={reload} /> : null}

            <LayoutSelect />

            {Object.entries(memos).map(([day, { memos, date, diffToToday }]) => (
                <div key={day} className="memo-list-day-group">
                    <DayHeader date={date} diffToToday={diffToToday} />
                    <hr className="memo-list-day-divider" />
                    <div className="memo-list-memos">
                        {memos.map((memo) => {
                            return (
                                <Memo
                                    key={memo.id}
                                    memo={memo}
                                    actions={memoActions}
                                    headerLink={true}
                                    doubleClickToEdit={doubleClickToEdit}
                                    collapsible={layout === "masonry"}
                                />
                            )
                        })}
                    </div>
                </div>
            ))}

            {!isLoading && <EndOfListMarker onReached={onEOLReached} />}

            {isLoading && (
                <div className="flex justify-center items-center min-h-[200px]">
                    <Loader />
                </div>
            )}
        </div>
    )
}
