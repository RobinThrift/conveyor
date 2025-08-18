import clsx from "clsx"
import React from "react"

import { MemoList } from "@/ui/components/MemoList"
import { MemoListFilter } from "@/ui/components/MemoListFilter"

import { Header } from "./Header"
import { NewMemoEditor } from "./NewMemoEditor"
import { useMemoListScreenState } from "./useMemoListScreenState"

export interface MemoListScreenProps {
    className?: string
}

export const MemoListScreen = React.memo(function MemoListScreen(props: MemoListScreenProps) {
    let { showEditor } = useMemoListScreenState()

    return (
        <div className={clsx("memo-list-screen", props.className)}>
            <MemoListFilter />

            <div className="memo-list-container">
                <Header />

                {showEditor && <NewMemoEditor />}

                <MemoList />
            </div>

            <div className="overflow-blur" />
        </div>
    )
})
