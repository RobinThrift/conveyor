import clsx from "clsx"
import React from "react"

import { EndOfListMarker } from "@/ui/components/EndOfListMarker"
import { Loader } from "@/ui/components/Loader"

import { DayHeader } from "./DayHeader"
import { MemoListItem } from "./MemoListItem"
import { ReloadButton } from "./ReloadButton"
import { useMemoListState } from "./useMemoListState"

export interface MemoListProps {
    className?: string
}

export function MemoList(props: MemoListProps) {
    let { items, isLoading, onEOLReached, reload, isListOutdated } = useMemoListState()

    return (
        <div
            className={clsx("memo-list", props.className)}
            aria-describedby="memo-list-header-list-description"
        >
            {isListOutdated ? <ReloadButton reload={reload} /> : null}

            <div className="memo-list-items">
                {Object.entries(items).map(([day, { memos, date }]) => (
                    <div key={day} className="memo-list-item-group">
                        <DayHeader date={date} />
                        {memos.map((memoID) => {
                            return <MemoListItem key={memoID} memoID={memoID} />
                        })}
                    </div>
                ))}
            </div>

            {!isLoading && <EndOfListMarker onReached={onEOLReached} />}

            {isLoading && (
                <div className="flex justify-center items-center min-h-[200px]">
                    <Loader />
                </div>
            )}
        </div>
    )
}
