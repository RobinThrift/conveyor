import type { Tag } from "@/domain/Tag"
import * as eventbus from "@/eventbus"
import { useAttachmentUploader } from "@/hooks/api/attachments"
import { settingsStore } from "@/storage/settings"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { languages } from "@codemirror/language-data"
import { SearchCursor } from "@codemirror/search"
import { useStore } from "@nanostores/react"
import { Vim, getCM, vim } from "@replit/codemirror-vim"
import { hyperLink } from "@uiw/codemirror-extensions-hyper-link"
import { quietlight } from "@uiw/codemirror-theme-quietlight"
import CodeMirror, {
    StateEffect,
    EditorView,
    type Extension,
} from "@uiw/react-codemirror"
import React, { useCallback, useEffect, useMemo } from "react"
import { fileDropHandler } from "./cmFileDropHandler"
import { tagsAutoComplete } from "./tagsAutoComplete"

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

export interface TextEditorProps {
    id: string
    tags: Tag[]
    content: string
    onChange: (content: string) => void
    onSave: () => void
    onCancel: () => void
    autoFocus?: boolean
    placeholder?: string
    placeCursorAt?: { x: number; y: number; snippet?: string }
}

export function TextEditor(props: TextEditorProps) {
    useAttachmentUploader()

    let enableVimKeybindings = useStore(settingsStore.$values, {
        keys: ["controls", "controls.vim"],
    }).controls.vim

    let extensions: Extension[] = useMemo(() => {
        return [
            fileDropHandler(),
            enableVimKeybindings ? vim() : [],
            markdown({ base: markdownLanguage, codeLanguages: languages }),
            hyperLink,
            tagsAutoComplete(props.tags),
        ]
    }, [props.tags, enableVimKeybindings])

    useEffect(() => {
        return eventbus.on(`vim:write:${props.id}`, props.onSave)
    }, [props.id, props.onSave])

    useEffect(() => {
        return eventbus.on(`vim:quit:${props.id}`, props.onCancel)
    }, [props.id, props.onCancel])

    let onCreateEditor = useCallback(
        (view: EditorView) => {
            if (!enableVimKeybindings) {
                return
            }

            Vim.handleEx(getCM(view), "startinsert")
            view.dispatch({
                effects: [StateEffect.appendConfig.of(EditorView.lineWrapping)],
            })

            if (!props.placeCursorAt) {
                return
            }

            let pos: number | null = null
            if (props.placeCursorAt.snippet) {
                let cursor = new SearchCursor(
                    view.state.doc,
                    props.placeCursorAt.snippet,
                    view.posAtCoords(props.placeCursorAt, false) ?? 0,
                    view.state.doc.length,
                    (x) => x.toLowerCase(),
                )

                pos = cursor.next().value?.from
            }

            if (!pos || pos === -1) {
                pos = view.posAtCoords(props.placeCursorAt, false)
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
        [props.placeCursorAt, enableVimKeybindings],
    )

    return (
        <CodeMirror
            id={props.id}
            minHeight="200px"
            className="vim-enabled w-full h-full min-h-[200px] -mb-[50px]"
            value={props.content}
            extensions={[extensions]}
            onChange={props.onChange}
            theme={quietlight}
            autoFocus={props.autoFocus}
            placeholder={props.placeholder}
            onCreateEditor={onCreateEditor}
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
            }}
        />
    )
}
