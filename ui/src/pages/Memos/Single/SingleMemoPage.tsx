import { Loader } from "@/components/Loader"
import { Memo, type PartialMemoUpdate } from "@/components/Memo"
import type { Tag } from "@/domain/Tag"
import type { Filter } from "@/state/memolist"
import { useSetting } from "@/state/settings"
import React, { useCallback, useEffect } from "react"
import { useSingleMemoPageState } from "./state"

export interface SingleMemoPageProps {
    memoID: string
    onChangeFilters?: (filter: Filter) => void
}

export function SingleMemoPage(props: SingleMemoPageProps) {
    let [doubleClickToEdit] = useSetting("controls.doubleClickToEdit")

    let { state, actions } = useSingleMemoPageState(props.memoID)

    useEffect(() => {
        if (!state?.memo) {
            actions.load()
        }
    }, [state?.memo, actions.load])

    let onClickTag = useCallback(
        (tag: string) => {
            props.onChangeFilters?.({ tag })
        },
        [props.onChangeFilters],
    )

    let updateMemoCallback = useCallback(
        (memo: PartialMemoUpdate) => {
            actions.update(memo)
        },
        [actions.update],
    )

    let tags: Tag[] = []

    return (
        <div
            className="container mx-auto max-w-[80rem]"
            style={{
                viewTransitionName: `memo-${props.memoID}`,
            }}
        >
            {(!state || state?.isLoading) && (
                <div className="memo animate-in slide-in-from-bottom fade-in">
                    <div className="flex justify-center items-center min-h-[200px]">
                        <Loader />
                    </div>
                </div>
            )}

            {state?.memo && (
                <Memo
                    memo={state?.memo}
                    tags={tags}
                    actions={{
                        link: false,
                        edit: !state.memo.isArchived && !state.memo.isDeleted,
                    }}
                    onClickTag={onClickTag}
                    updateMemo={updateMemoCallback}
                    doubleClickToEdit={doubleClickToEdit}
                    className="min-h-[200px]"
                />
            )}
        </div>
    )
}
