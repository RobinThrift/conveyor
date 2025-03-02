// import { useAttachmentUploader } from "@/ui/state/global/attachments"
import type { EditorView } from "@codemirror/view"
import { useCallback, useEffect, useMemo, useRef } from "react"

import type { Tag } from "@/domain/Tag"
import * as eventbus from "@/ui/eventbus"

import {
    insertLink,
    toggleBold,
    toggleItalics,
    toggleMonospace,
} from "./textEditorCommands"

export function useTextEditorState(opts: {
    id: string
    onSave: () => void
    onCancel: () => void
    placeCursorAt?: { x: number; y: number; snippet?: string }
    enableVimMode?: boolean
    tags: Tag[]
}) {
    let cmView = useRef<EditorView | null>(null)

    // useAttachmentUploader()

    useEffect(() => {
        return eventbus.on(`vim:write:${opts.id}`, opts.onSave)
    }, [opts.id, opts.onSave])

    useEffect(() => {
        return eventbus.on(`vim:quit:${opts.id}`, opts.onCancel)
    }, [opts.id, opts.onCancel])

    let onCreateEditor = useCallback((view: EditorView) => {
        cmView.current = view
    }, [])

    let cmds = useMemo(
        () => ({
            toggleBoldCmd: () => cmView.current && toggleBold(cmView.current),
            toggleItalics: () =>
                cmView.current && toggleItalics(cmView.current),
            toggleMonospace: () =>
                cmView.current && toggleMonospace(cmView.current),
            insertLink: () => {
                if (!cmView.current) {
                    return
                }
                insertLink(cmView.current)
                cmView.current.focus()
            },
        }),
        [],
    )

    return {
        onCreateEditor,
        cmds,
    }
}
