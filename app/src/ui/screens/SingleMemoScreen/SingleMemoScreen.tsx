import React from "react"

import { Button } from "@/ui/components/Button"
import { ArrowLeftIcon } from "@/ui/components/Icons"
import { Loader } from "@/ui/components/Loader"
import { Memo } from "@/ui/components/Memo"
import { useT } from "@/ui/i18n"
import { useSetting } from "@/ui/settings"

import { useNavigation } from "@/ui/navigation"
import clsx from "clsx"
import { useSingleMemoScreenState } from "./useSingleMemoScreenState"

export interface SingleMemoScreenProps {
    className?: string
}

export function SingleMemoScreen(props: SingleMemoScreenProps) {
    let t = useT("screens/SingleMemoScreen")
    let [doubleClickToEdit] = useSetting("controls.doubleClickToEdit")
    let nav = useNavigation()

    let { ref, memo, isLoading, memoActions } = useSingleMemoScreenState()

    return (
        <div className={clsx("single-memo-screen", props.className)} ref={ref}>
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
                onPress={() => nav.popStack()}
            />

            {memo && (
                <Memo memo={memo} actions={memoActions} doubleClickToEdit={doubleClickToEdit} />
            )}
        </div>
    )
}
