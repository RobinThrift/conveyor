import clsx from "clsx"
import React from "react"

import { Editor } from "@/ui/components/Editor"
import { PlusCircleIcon } from "@/ui/components/Icons"
import { LinkButton } from "@/ui/components/Link"

import { useNewMemoEditorState } from "./useNewMemoEditorState"

export interface NewMemoEditorProps {
    className?: string
}

export function NewMemoEditor(props: NewMemoEditorProps) {
    let { createMemo, newMemo, transferAttachment, tags, vimModeEnabled } = useNewMemoEditorState()

    return (
        <>
            <div className={clsx("new-memo-editor", props.className)}>
                <Editor
                    memo={newMemo}
                    tags={tags}
                    placeholder="Belt out a memo..."
                    vimModeEnabled={vimModeEnabled}
                    onSave={createMemo}
                    transferAttachment={transferAttachment}
                    autoFocus={true}
                />
            </div>
            <LinkButton
                screen="memo.new"
                className="new-memo-editor-fab"
                iconRight={<PlusCircleIcon />}
            >
                <span className="sr-only">New memo</span>
            </LinkButton>
        </>
    )
}
