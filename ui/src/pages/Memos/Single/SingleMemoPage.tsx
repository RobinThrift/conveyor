import type { Filter } from "@/api/memos"
import { Loader } from "@/components/Loader"
import { Memo, type PartialMemoUpdate } from "@/components/Memo"
import type { Tag } from "@/domain/Tag"
import { useSetting } from "@/storage/settings"
import React, { useCallback } from "react"
import { useSingleMemoPageState } from "./state"

export interface SingleMemoPageProps {
    memoID: string
    onChangeFilters?: (filter: Filter) => void
}

export function SingleMemoPage(props: SingleMemoPageProps) {
    let [doubleClickToEdit] = useSetting<boolean, "controls.doubleClickToEdit">(
        "controls.doubleClickToEdit",
    )

    let { memo, isLoading, updateMemo } = useSingleMemoPageState(props.memoID)

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
        <div className="container mx-auto max-w-4xl">
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
                    doubleClickToEdit={doubleClickToEdit}
                />
            )}
        </div>
    )
}
