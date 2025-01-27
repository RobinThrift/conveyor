import React from "react"

import { Editor } from "@/components/Editor"
import { Loader } from "@/components/Loader"

import { useMemoNewPageState } from "./useMemoNewPageState"

export function MemoNewPage() {
    let { newMemo, isLoading, tags, createMemo, cancelNew } =
        useMemoNewPageState()

    return (
        <div className="memo-new-page">
            <Editor
                memo={newMemo}
                tags={tags}
                onSave={createMemo}
                onCancel={cancelNew}
                autoFocus={true}
                placeholder="Belt out a Memo..."
            />

            {isLoading && (
                <div className="flex justify-center items-center min-h-[200px]">
                    <Loader />
                </div>
            )}
        </div>
    )
}
