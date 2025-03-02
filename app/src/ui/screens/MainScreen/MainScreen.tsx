import React from "react"

import { EndOfListMarker } from "@/ui/components/EndOfListMarker"
import { Loader } from "@/ui/components/Loader"
import { MemoList, MemoListHeader } from "@/ui/components/MemoList"
import { MemoListFilter } from "@/ui/components/MemoListFilter"
import { useSetting } from "@/ui/state/global/settings"

import { NewMemoEditor } from "./NewMemoEditor"
import { type Filter, useMainScreenState } from "./useMainScreenState"

export interface MainScreenProps {
    filter: Filter
    onChangeFilter?: (filter: Filter) => void
}

export function MainScreen(props: MainScreenProps) {
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
    } = useMainScreenState(props)
    let [doubleClickToEdit] = useSetting("controls.doubleClickToEdit")

    let showEditor = Object.keys(props.filter).length === 0

    return (
        <div className="main-screen memos-archive-page">
            <MemoListFilter
                tags={tags}
                filter={filter}
                onChangeFilter={setFilter}
            />

            <div className="main-screen-content">
                <MemoListHeader
                    className="main-screen-content-container"
                    filter={filter}
                />

                {showEditor && (
                    <NewMemoEditor
                        className="main-screen-content-container"
                        createMemo={createMemo}
                        tags={tags}
                        inProgress={isCreatingMemo}
                    />
                )}

                <MemoList
                    className="main-screen-content-container"
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
