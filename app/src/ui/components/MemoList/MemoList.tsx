import clsx from "clsx"
import React, { useEffect, useMemo, useRef } from "react"

import { EndOfListMarker } from "@/ui/components/EndOfListMarker"
import { Loader } from "@/ui/components/Loader"
import { Memo } from "@/ui/components/Memo"

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

    let memoComponents = useMemo(
        () =>
            Object.entries(memos).map(([day, { memos, date, diffToToday }]) => (
                <div key={day} className="memo-list-day-group">
                    <DayHeader date={date} diffToToday={diffToToday} />
                    <hr className="memo-list-day-divider" />
                    <div className="memo-list-memos">
                        {memos.map((memo) => {
                            return (
                                <Memo
                                    key={memo.id}
                                    memo={memo}
                                    actions={{
                                        ...memoActions,
                                    }}
                                    headerLink={true}
                                    doubleClickToEdit={doubleClickToEdit}
                                    collapsible={layout === "masonry"}
                                />
                            )
                        })}
                    </div>
                </div>
            )),
        [memos, layout, doubleClickToEdit, memoActions],
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: this is intentional
    useEffect(() => {
        if (!ref.current || !focusedMemoID) {
            return
        }

        let el = ref.current.querySelector(`#memo-${focusedMemoID}`)
        el?.scrollIntoView({ behavior: "instant", block: "start" })
    }, [ref.current?.querySelector(`#memo-${focusedMemoID}`), focusedMemoID])

    return (
        <div
            className={clsx(
                "memo-list",
                `list-layout-${layout}`,
                props.className,
            )}
            ref={ref}
        >
            {isListOutdated ? <ReloadButton reload={reload} /> : null}

            <LayoutSelect />

            {memoComponents}

            {!isLoading && <EndOfListMarker onReached={onEOLReached} />}

            {isLoading && (
                <div className="flex justify-center items-center min-h-[200px]">
                    <Loader />
                </div>
            )}
        </div>
    )
}
