import clsx from "clsx"
import React from "react"

import type { Tag } from "@/domain/Tag"
import { Editor } from "@/ui/components/Editor"
import { PlusIcon } from "@/ui/components/Icons"
import { LinkButton } from "@/ui/components/Link"

import type { CreateMemoRequest } from "./useMainScreenState"
import { useNewMemoEditorState } from "./useNewMemoEditorState"

export interface NewMemoEditorProps {
    className?: string
    tags: Tag[]
    createMemo: (memo: CreateMemoRequest) => void
    inProgress: boolean
}

export function NewMemoEditor(props: NewMemoEditorProps) {
    let { createMemo, newMemo, transferAttachment } =
        useNewMemoEditorState(props)

    return (
        <>
            <div className={clsx("new-memo-editor", props.className)}>
                <Editor
                    memo={newMemo}
                    tags={props.tags}
                    placeholder="Belt out a memo..."
                    onSave={createMemo}
                    transferAttachment={transferAttachment}
                />
            </div>
            <LinkButton
                href="/memos/new"
                className="new-memo-editor-fab"
                iconRight={<PlusIcon />}
                variant="primary"
            >
                <span className="sr-only">New memo</span>
            </LinkButton>
        </>
    )
}
