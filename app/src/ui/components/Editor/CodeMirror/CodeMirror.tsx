import type { ChangeSet } from "@codemirror/state"
import type { EditorView } from "@codemirror/view"
import React, { useRef } from "react"

import type { AttachmentID } from "@/domain/Attachment"
import type { Tag } from "@/domain/Tag"

import { useCodeMirror } from "./useCodeMirror"

export interface CodeMirrorProps {
    id: string
    className?: string

    text: string

    autoFocus?: boolean
    placeCursorAt?: { x: number; y: number; snippet?: string }

    placeholder?: string

    autocomplete?: {
        tags?: Tag[]
    }

    vimModeEnabled?: boolean

    onCreateEditor?: (view: EditorView) => void
    onChange?: (text: string, changes: ChangeSet) => void

    transferAttachment(attachment: {
        id: AttachmentID
        filename: string
        content: ArrayBufferLike
    }): Promise<void>
}

export function CodeMirror(props: CodeMirrorProps) {
    let ref = useRef<HTMLDivElement>(null)

    useCodeMirror({
        ref: ref.current,
        ...props,
    })

    return <div ref={ref} className={props.className} data-testid="texteditor" />
}
