import type { EditorView } from "@codemirror/view"
import { useCallback, useEffect, useMemo, useRef } from "react"

import type { Tag } from "@/domain/Tag"
import * as eventbus from "@/ui/eventbus"
import {
    copyToClipboard,
    insertCodeBlock,
    type PasteItem,
    pasteFromClipboard,
    toggleBold,
    toggleItalics,
    toggleMonospace,
    wrapAsLink,
} from "./commands"
import type { ToolbarCommands } from "./TextEditor"

export function useTextEditorState(opts: {
    id: string
    onSave: () => void
    onCancel: () => void
    enableVimMode?: boolean
    tags: Tag[]
}) {
    let cmView = useRef<EditorView | null>(null)

    useEffect(() => {
        return eventbus.on(`vim:write:${opts.id}`, opts.onSave)
    }, [opts.id, opts.onSave])

    useEffect(() => {
        return eventbus.on(`vim:quit:${opts.id}`, opts.onCancel)
    }, [opts.id, opts.onCancel])

    let onCreateEditor = useCallback((view: EditorView) => {
        if (cmView.current === view) {
            return
        }

        cmView.current = view
    }, [])

    let cmds = useMemo(
        () =>
            ({
                toggleBold: () => cmView.current && toggleBold(cmView.current),
                toggleItalics: () => cmView.current && toggleItalics(cmView.current),
                toggleMonospace: () => cmView.current && toggleMonospace(cmView.current),
                insertLink: () => {
                    if (!cmView.current) {
                        return
                    }
                    wrapAsLink(cmView.current)
                    cmView.current.focus()
                },
                insertCodeBlock: () => cmView.current && insertCodeBlock(cmView.current),
                copyToClipboard: () => {
                    if (!cmView.current) {
                        return
                    }

                    copyToClipboard(cmView.current)
                    cmView.current.focus()
                },
                pasteFromClipboard: (items: PasteItem[]) => {
                    if (!cmView.current) {
                        return
                    }

                    pasteFromClipboard(cmView.current, items)
                    cmView.current.focus()
                },
            }) satisfies ToolbarCommands,
        [],
    )

    return {
        onCreateEditor,
        cmds,
    }
}
