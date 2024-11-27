import type { Filter } from "@/api/memos"
import { Loader } from "@/components/Loader"
import { Memo, type PartialMemoUpdate } from "@/components/Memo"
import type { Tag } from "@/domain/Tag"
import React, { useCallback } from "react"
import { useSingleMemoPageState } from "./state"

export interface SingleMemoPageProps {
    memoID: string
    onChangeFilters?: (filter: Filter) => void
}

export function SingleMemoPage(props: SingleMemoPageProps) {
    let { memo, isLoading, updateMemo, error } = useSingleMemoPageState(
        props.memoID,
    )

    if (error) {
        // @TODO: proper error handling
        console.error(error)
    }

    let onClickTag = useCallback(
        (tag: string) => {
            props.onChangeFilters?.({ tag })
        },
        [props.onChangeFilters],
    )

    let updateMemoCallback = useCallback(
        (memo: PartialMemoUpdate) => {
            updateMemo({ memo })
        },
        [updateMemo],
    )

    let tags: Tag[] = []

    return (
        <div className="container mx-auto">
            {isLoading && (
                <div className="flex justify-center items-center min-h-[200px]">
                    <Loader />
                </div>
            )}

            {memo && (
                <Memo
                    key={memo.id}
                    memo={memo}
                    tags={tags}
                    onClickTag={onClickTag}
                    updateMemo={updateMemoCallback}
                    className="animate-in slide-in-from-bottom fade-in"
                    doubleClickToEdit={true}
                />
            )}
        </div>
    )
}
