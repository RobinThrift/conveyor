import React from "react"

import { Button } from "@/ui/components/Button"
import { ArrowLeftIcon } from "@/ui/components/Icons"
import { Loader } from "@/ui/components/Loader"
import { Memo } from "@/ui/components/Memo"
import { useT } from "@/ui/i18n"
import { useSetting } from "@/ui/settings"
import { useGoBack } from "@/ui/state/global/router"

import { useSingleMemoScreenState } from "./useSingleMemoScreenState"

export interface SingleMemoScreenProps {
    memoID: string
}

export function SingleMemoScreen(props: SingleMemoScreenProps) {
    let t = useT("screens/SingleMemoScreen")
    let [doubleClickToEdit] = useSetting("controls.doubleClickToEdit")
    let goBack = useGoBack()

    let { memo, isLoading, memoActions } = useSingleMemoScreenState({
        memoID: props.memoID,
    })

    return (
        <div className="single-memo-screen">
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
