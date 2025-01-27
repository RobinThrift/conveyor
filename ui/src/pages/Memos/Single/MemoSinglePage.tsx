import React from "react"

import { Button } from "@/components/Button"
import { Loader } from "@/components/Loader"
import { Memo } from "@/components/Memo"
import { useT } from "@/i18n"
import { useGoBack } from "@/state/global/router"
import { useSetting } from "@/state/global/settings"

import { ArrowLeftIcon } from "@/components/Icons"
import { useMemoSinglePageState } from "./useMemoSinglePageState"

export interface MemoSinglePageProps {
    memoID: string
}

export function MemoSinglePage(props: MemoSinglePageProps) {
    let t = useT("pages/MemoSinglePage")
    let [doubleClickToEdit] = useSetting("controls.doubleClickToEdit")
    let goBack = useGoBack()

    let { memo, isLoading, memoActions } = useMemoSinglePageState({
        memoID: props.memoID,
    })

    return (
        <div className="memo-single-page">
            {isLoading && (
                <div className="memo animate-in slide-in-from-bottom fade-in">
                    <div className="flex justify-center items-center min-h-[200px]">
                        <Loader />
                    </div>
                </div>
            )}

            <Button
                plain
                ariaLabel={t.Back}
                iconRight={<ArrowLeftIcon />}
                className="back-btn"
                onClick={() => goBack({ viewTransition: true, fallback: "/" })}
            />

            {memo && (
                <Memo
                    memo={memo}
                    actions={memoActions}
                    doubleClickToEdit={doubleClickToEdit}
                />
            )}
        </div>
    )
}
