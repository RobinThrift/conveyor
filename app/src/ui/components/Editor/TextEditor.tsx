import clsx from "clsx"
import React from "react"

import type { AttachmentID } from "@/domain/Attachment"
import type { Tag } from "@/domain/Tag"
import type { ChangeSet } from "@codemirror/state"

import { CodeMirror } from "./CodeMirror"
import type { Commands } from "./Commands"
import { useTextEditorState } from "./useTextEditorState"

export interface TextEditorProps {
    id: string

    tags: Tag[]
    content: string
    autoFocus?: boolean
    overrideKeybindings?: boolean
    placeholder?: string
    placeCursorAt?: { x: number; y: number; snippet?: string }

    vimModeEnabled?: boolean

    onChange: (text: string, changes: ChangeSet) => void
    onSave: () => void
    onCancel: () => void

    transferAttachment(attachment: {
        id: AttachmentID
        filename: string
        content: ArrayBufferLike
    }): Promise<void>

    children: (cmds: Commands) => React.ReactNode
}

export function TextEditor(props: TextEditorProps) {
    let { cmds, onCreateEditor } = useTextEditorState(props)

    return (
        <>
            <CodeMirror
                id={props.id}
                className={clsx("text-editor", {
                    "vim-enabled ": props.vimModeEnabled,
                })}
                onCreateEditor={onCreateEditor}
                vimModeEnabled={props.vimModeEnabled}
                text={props.content}
                onChange={props.onChange}
                autoFocus={props.autoFocus}
                placeholder={props.placeholder}
                transferAttachment={props.transferAttachment}
            />
            {props.children(cmds)}
        </>
    )
}
