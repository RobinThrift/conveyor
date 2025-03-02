import * as RadixToolbar from "@radix-ui/react-toolbar"
import clsx from "clsx"
import React, { useCallback } from "react"

import type { AttachmentID } from "@/domain/Attachment"
import type { Tag } from "@/domain/Tag"
import {
    CodeIcon,
    LinkIcon,
    TextBolderIcon,
    TextItalicIcon,
} from "@/ui/components/Icons"
import { useT } from "@/ui/i18n"
import type { ChangeSet } from "@codemirror/state"

import { CodeMirror } from "./CodeMirror"
import { useTextEditorState } from "./useTextEditorState"

export interface TextEditorProps {
    vimModeEnabled?: boolean

    id: string
    tags: Tag[]
    content: string
    autoFocus?: boolean
    overrideKeybindings?: boolean
    placeholder?: string
    placeCursorAt?: { x: number; y: number; snippet?: string }

    onChange: (text: string, changes: ChangeSet) => void
    onSave: () => void
    onCancel: () => void

    transferAttachment(attachment: {
        id: AttachmentID
        filename: string
        content: ArrayBufferLike
    }): Promise<void>
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
                text={props.content}
                onChange={props.onChange}
                autoFocus={props.autoFocus}
                placeholder={props.placeholder}
                transferAttachment={props.transferAttachment}
            />
            <EditorToolbar {...cmds} />
        </>
    )
}

function EditorToolbar({
    toggleBoldCmd,
    toggleItalics,
    toggleMonospace,
    insertLink,
}: {
    toggleBoldCmd: () => void
    toggleItalics: () => void
    toggleMonospace: () => void
    insertLink: () => void
}) {
    let t = useT("components/Editor/Toolbar")

    let onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
    }, [])

    return (
        <RadixToolbar.Root className="text-editor-toolbar">
            <div className="toolbar-btn-grp" aria-label={t.TextFormatting}>
                <RadixToolbar.Button
                    className="btn plain toolbar-btn"
                    aria-label={t.TextFormattingBold}
                    onClick={toggleBoldCmd}
                    onMouseDown={onMouseDown}
                >
                    <TextBolderIcon />
                </RadixToolbar.Button>

                <RadixToolbar.Button
                    className="btn plain toolbar-btn"
                    aria-label={t.TextFormattingItalic}
                    onClick={toggleItalics}
                    onMouseDown={onMouseDown}
                >
                    <TextItalicIcon />
                </RadixToolbar.Button>

                <RadixToolbar.Button
                    className="btn plain toolbar-btn"
                    aria-label={t.TextFormattingMonospace}
                    onClick={toggleMonospace}
                    onMouseDown={onMouseDown}
                >
                    <CodeIcon />
                </RadixToolbar.Button>

                <RadixToolbar.Button
                    className="btn plain toolbar-btn"
                    aria-label={t.InsertLink}
                    onClick={insertLink}
                    onMouseDown={onMouseDown}
                >
                    <LinkIcon />
                </RadixToolbar.Button>
            </div>
        </RadixToolbar.Root>
    )
}
