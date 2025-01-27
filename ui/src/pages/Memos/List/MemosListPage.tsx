import React from "react"

import { EndOfListMarker } from "@/components/EndOfListMarker"
import { Loader } from "@/components/Loader"
import { MemoList, MemoListHeader } from "@/components/MemoList"
import { MemoListFilter } from "@/components/MemoListFilter"
import { useSetting } from "@/state/global/settings"

import { NewMemoEditor } from "./NewMemoEditor"
import { type Filter, useMemosListPageState } from "./useMemosListPageState"

export interface MemosListPageProps {
    filter: Filter
    onChangeFilters?: (filter: Filter) => void
}

export function MemosListPage(props: MemosListPageProps) {
    let {
        memos,
        isLoading,
        filter,
        tags,
        setFilter,
        onEOLReached,
        memoActions,
        createMemo,
        isCreatingMemo,
    } = useMemosListPageState(props)
    let [doubleClickToEdit] = useSetting("controls.doubleClickToEdit")

    let showEditor = Object.keys(props.filter).length === 0

    return (
        <div className="memos-list-page memos-archive-page">
            <MemoListFilter
                tags={tags}
                filter={filter}
                onChangeFilter={setFilter}
            />

            <div className="memos-list-page-content">
                <MemoListHeader
                    className="memos-list-page-content-container"
                    filter={filter}
                />

                {showEditor && (
                    <NewMemoEditor
                        className="memos-list-page-content-container"
                        createMemo={createMemo}
                        tags={tags}
                        inProgress={isCreatingMemo}
                    />
                )}

                <MemoList
                    className="memos-list-page-content-container"
                    memos={memos}
                    doubleClickToEdit={doubleClickToEdit}
                    actions={memoActions}
                />

                {!isLoading && <EndOfListMarker onReached={onEOLReached} />}

                {isLoading && (
                    <div className="flex justify-center items-center min-h-[200px]">
                        <Loader />
                    </div>
                )}
            </div>
        </div>
    )
}
