import {
    CodeIcon,
    LinkIcon,
    TextBolderIcon,
    TextItalicIcon,
} from "@/components/Icons"
import type { Tag } from "@/domain/Tag"
import { useT } from "@/i18n"
import * as RadixToolbar from "@radix-ui/react-toolbar"
import CodeMirror from "@uiw/react-codemirror"
import clsx from "clsx"
import React, { useCallback } from "react"
import { useTextEditorState } from "./useTextEditorState"

export interface TextEditorProps {
    id: string
    tags: Tag[]
    content: string
    onChange: (content: string) => void
    onSave: () => void
    onCancel: () => void
    autoFocus?: boolean
    overrideKeybindings?: boolean
    placeholder?: string
    placeCursorAt?: { x: number; y: number; snippet?: string }
}

export function TextEditor(props: TextEditorProps) {
    let { colours, extensions, enableVimKeybindings, cmds, onCreateEditor } =
        useTextEditorState(props)

    return (
        <>
            <CodeMirror
                id={props.id}
                className={clsx("text-editor", {
                    "vim-enabled ": enableVimKeybindings,
                })}
                onCreateEditor={onCreateEditor}
                value={props.content}
                extensions={[extensions]}
                onChange={props.onChange}
                theme={colours.cm}
                autoFocus={props.autoFocus}
                placeholder={props.placeholder}
                basicSetup={{
                    highlightActiveLine: false,
                    lineNumbers: false,
                    bracketMatching: true,
                    indentOnInput: true,
                    closeBrackets: true,
                    foldGutter: false,
                    highlightSelectionMatches: true,
                    drawSelection: true,
                    tabSize: 4,
                    dropCursor: true,
                    autocompletion: true,
                    syntaxHighlighting: true,
                }}
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
