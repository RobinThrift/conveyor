import clsx from "clsx"
import React from "react"

import { Editor } from "@/ui/components/Editor"
import { Loader } from "@/ui/components/Loader"

import { useNewMemoScreenState } from "./useNewMemoScreenState"

export function NewMemoScreen({ className }: { className?: string }) {
    let { newMemo, isLoading, tags, createMemo, cancelNew, transferAttachment, settings } =
        useNewMemoScreenState()

    return (
        <div className={clsx("new-memo-screen", className)}>
            <Editor
                memo={newMemo}
                tags={tags}
                autoFocus={true}
                vimModeEnabled={settings.vimModeEnabled}
                placeholder="Belt out a Memo..."
                onSave={createMemo}
                onCancel={cancelNew}
                transferAttachment={transferAttachment}
            />

            {isLoading && (
                <div className="flex justify-center items-center min-h-[200px]">
                    <Loader />
                </div>
            )}
        </div>
    )
}
