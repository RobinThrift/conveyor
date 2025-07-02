import { SearchCursor } from "@codemirror/search"
import type { EditorView } from "@codemirror/view"
import { useCallback, useEffect, useMemo, useRef } from "react"

import type { Tag } from "@/domain/Tag"
import * as eventbus from "@/ui/eventbus"

import type { ToolbarCommands } from "./TextEditor"
import {
    type PasteItem,
    copyToClipboard,
    pasteFromClipboard,
    toggleBold,
    toggleItalics,
    toggleMonospace,
    wrapAsLink,
} from "./commands"

export function useTextEditorState(opts: {
    id: string
    onSave: () => void
    onCancel: () => void
    placeCursorAt?: { x: number; y: number; snippet?: string }
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

    let onCreateEditor = useCallback(
        (view: EditorView) => {
            cmView.current = view

            if (!opts.placeCursorAt) {
                return
            }

            let pos: number | null = null
            if (opts.placeCursorAt.snippet) {
                let cursor = new SearchCursor(
                    view.state.doc,
                    opts.placeCursorAt.snippet,
                    view.posAtCoords(opts.placeCursorAt, false) ?? 0,
                    view.state.doc.length,
                    (x) => x.toLowerCase(),
                )

                pos = cursor.next().value?.from
            }

            if (!pos || pos === -1) {
                pos = view.posAtCoords(opts.placeCursorAt, false)
            }

            if (pos) {
                view.dispatch({
                    selection: {
                        anchor: pos,
                    },
                    scrollIntoView: true,
                })
            }
        },
        [opts.placeCursorAt],
    )

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
