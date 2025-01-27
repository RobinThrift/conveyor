import clsx from "clsx"
import React from "react"

import { Editor } from "@/components/Editor"
import { PlusIcon } from "@/components/Icons"
import { LinkButton } from "@/components/Link"
import type { Tag } from "@/domain/Tag"

import type { CreateMemoRequest } from "./useMemosListPageState"
import { useNewMemoEditorState } from "./useNewMemoEditorState"

export interface NewMemoEditorProps {
    className?: string
    tags: Tag[]
    createMemo: (memo: CreateMemoRequest) => void
    inProgress: boolean
}

export function NewMemoEditor(props: NewMemoEditorProps) {
    let { createMemo, newMemo } = useNewMemoEditorState(props)

    return (
        <>
            <div className={clsx("new-memo-editor", props.className)}>
                <Editor
                    memo={newMemo}
                    tags={props.tags}
                    onSave={createMemo}
                    placeholder="Belt out a memo..."
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
