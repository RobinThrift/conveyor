import type { Tag } from "@/domain/Tag"
import * as eventbus from "@/eventbus"
import { useAttachmentUploader } from "@/state/global/attachments"
import { useSetting, useTheme } from "@/state/global/settings"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { languages } from "@codemirror/language-data"
import { SearchCursor } from "@codemirror/search"
import { Vim, vim } from "@replit/codemirror-vim"
import { EditorView, type Extension } from "@uiw/react-codemirror"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { fileDropHandler } from "./cmFileDropHandler"
import { tagsAutoComplete } from "./tagsAutoComplete"
import {
    insertLink,
    toggleBold,
    toggleItalics,
    toggleMonospace,
} from "./textEditorCommands"
import { toolbarPositionFix } from "./textEditorToolbarPositionFix"

export function useTextEditorState(opts: {
    id: string
    onSave: () => void
    onCancel: () => void
    placeCursorAt?: { x: number; y: number; snippet?: string }
    overrideKeybindings?: boolean
    tags: Tag[]
}) {
    let cmView = useRef<EditorView | null>(null)
    let { colours } = useTheme()

    useAttachmentUploader()

    let [enableVimKeybindingsSetting] = useSetting("controls.vim")
    let enableVimKeybindings =
        enableVimKeybindingsSetting && !opts.overrideKeybindings

    let extensions: Extension[] = useMemo(() => {
        return [
            fileDropHandler(),
            enableVimKeybindings ? vim() : [],
            markdown({ base: markdownLanguage, codeLanguages: languages }),
            tagsAutoComplete(opts.tags),
            toolbarPositionFix,
            EditorView.lineWrapping,
        ]
    }, [opts.tags, enableVimKeybindings])

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
        colours,
        extensions,
        onCreateEditor,
        enableVimKeybindings,
        cmds,
    }
}

Vim.defineEx("write", "w", (cm: { cm6: EditorView }) => {
    eventbus.emit(`vim:write:${cm.cm6.dom.parentElement?.id ?? "global"}`)
})

Vim.defineEx("wquit", "wq", (cm: { cm6: EditorView }) => {
    eventbus.emit(`vim:write:${cm.cm6.dom.parentElement?.id ?? "global"}`)
})

Vim.defineEx("quit", "q", (cm: { cm6: EditorView }) => {
    eventbus.emit(`vim:quit:${cm.cm6.dom.parentElement?.id ?? "global"}`)
})

Vim.defineEx("cquit", "cq", (cm: { cm6: EditorView }) => {
    eventbus.emit(`vim:quit:${cm.cm6.dom.parentElement?.id ?? "global"}`)
})

Vim.map("A", "g$a")
Vim.map("I", "g0i")

Vim.map("j", "gj")
Vim.map("j", "gj", "visual")

Vim.map("k", "gk")
Vim.map("k", "gk", "visual")
