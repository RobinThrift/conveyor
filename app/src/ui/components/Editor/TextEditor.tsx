import type { ChangeSet } from "@codemirror/state"
import clsx from "clsx"
import React from "react"
import type { AttachmentID } from "@/domain/Attachment"
import type { Tag } from "@/domain/Tag"

import { CodeMirror } from "./CodeMirror"
import type { PasteItem } from "./commands"
import { useTextEditorState } from "./useTextEditorState"

export type ToolbarCommands = {
    toggleBold: () => void
    toggleItalics: () => void
    toggleMonospace: () => void
    insertLink: () => void
    insertCodeBlock: () => void

    copyToClipboard: () => void
    pasteFromClipboard: (items: PasteItem[]) => void
}

export interface TextEditorProps {
    id: string

    tags: Tag[]
    content: string
    autoFocus?: boolean
    overrideKeybindings?: boolean
    placeCursorAt?: { x?: number; y?: number; snippet?: string; pageTop?: number; pos?: number }

    vimModeEnabled?: boolean

    onChange: (text: string, changes: ChangeSet) => void
    onSave: () => void
    onCancel: () => void

    autocomplete?: {
        tags?: Tag[]
    }

    transferAttachment(attachment: {
        id: AttachmentID
        filename: string
        data: Uint8Array
    }): Promise<void>

    children: (cmds: ToolbarCommands) => React.ReactNode
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
                placeCursorAt={props.placeCursorAt}
                vimModeEnabled={props.vimModeEnabled}
                autocomplete={props.autocomplete}
                text={props.content}
                onChange={props.onChange}
                autoFocus={props.autoFocus}
                transferAttachment={props.transferAttachment}
            />
            {props.children(cmds)}
        </>
    )
}
