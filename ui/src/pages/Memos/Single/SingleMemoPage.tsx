import { Loader } from "@/components/Loader"
import { Memo, type PartialMemoUpdate } from "@/components/Memo"
import type { Tag } from "@/domain/Tag"
import { useSetting } from "@/state/settings"
import React, { useCallback, useEffect } from "react"
import { useSingleMemoPageState } from "./state"

export interface SingleMemoPageProps {
    memoID: string
}

export function SingleMemoPage(props: SingleMemoPageProps) {
    let [doubleClickToEdit] = useSetting("controls.doubleClickToEdit")

    let { state, actions } = useSingleMemoPageState(props.memoID)

    useEffect(() => {
        if (!state?.memo) {
            actions.load()
        }
    }, [state?.memo, actions.load])

    let updateMemoCallback = useCallback(
        (memo: PartialMemoUpdate) => {
            actions.update(memo)
        },
        [actions.update],
    )

    let tags: Tag[] = []

    return (
        <div
            className="single-memo-page"
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
                    updateMemo={updateMemoCallback}
                    doubleClickToEdit={doubleClickToEdit}
                    className=""
                />
            )}
        </div>
    )
}
