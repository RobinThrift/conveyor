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

export function MemoListScreen(props: MemoListScreenProps) {
    let { showEditor, filter, tags, setFilter } = useMemoListScreenState()

    return (
        <div className={clsx("memo-list-screen", props.className)}>
            <MemoListFilter
                tags={tags}
                filter={filter}
                onChangeFilter={setFilter}
            />

            <div className="memo-list-container">
                <Header filter={filter} />

                {showEditor && <NewMemoEditor />}

                <MemoList />
            </div>
        </div>
    )
}
