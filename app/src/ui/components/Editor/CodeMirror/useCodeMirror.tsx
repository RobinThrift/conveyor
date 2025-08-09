import { SearchCursor } from "@codemirror/search"
import { Annotation, type ChangeSet, EditorState } from "@codemirror/state"
import { EditorView, type ViewUpdate } from "@codemirror/view"
import { useEffect, useMemo, useState } from "react"

import type { AttachmentID } from "@/domain/Attachment"
import type { Tag } from "@/domain/Tag"

import { useAttachmentLoader } from "@/ui/attachments"
import { extensions } from "./extensions"

export function useCodeMirror({
    ref,
    text,
    autoFocus,
    placeCursorAt,
    autocomplete,
    vimModeEnabled,
    onCreateEditor,
    onChange,
    transferAttachment,
}: {
    ref?: HTMLDivElement | null

    text: string

    autoFocus?: boolean
    placeCursorAt?: { x: number; y: number; snippet?: string }

    autocomplete?: {
        tags?: Tag[]
    }

    vimModeEnabled?: boolean

    onCreateEditor?: (view: EditorView) => void
    onChange?: (text: string, changes: ChangeSet) => void

    transferAttachment(attachment: {
        id: AttachmentID
        filename: string
        data: Uint8Array
    }): Promise<void>
}) {
    let [editorState, setEditorState] = useState<EditorState>()
    let [editorView, setEditorView] = useState<EditorView>()

    let getAttachmentDataByID = useAttachmentLoader()

    let updateListener = useMemo(
        () =>
            onChange
                ? EditorView.updateListener.of((view: ViewUpdate) => {
                      if (!view.docChanged) {
                          return
                      }

                      onChange(view.state.doc.toString(), view.changes)
                  })
                : [],
        [onChange],
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: should only run once
    useEffect(() => {
        if (!ref || editorState) {
            return () => {
                if (editorView) {
                    setEditorState(undefined)
                    setEditorView(undefined)
                }
            }
        }

        let initEditorState = EditorState.create({
            doc: text,
            extensions: [
                ...extensions({
                    vimModeEnabled,
                    autocomplete,
                    transferAttachment,
                    getAttachmentDataByID,
                }),
                updateListener,
            ],
        })

        setEditorState(initEditorState)

        let initEditorView = new EditorView({
            state: initEditorState,
            parent: ref,
        })
        setEditorView(initEditorView)
        onCreateEditor?.(initEditorView)

        if (!placeCursorAt) {
            return
        }

        let pos: number | null = null
        if (placeCursorAt.snippet) {
            let cursor = new SearchCursor(
                initEditorView.state.doc,
                placeCursorAt.snippet,
                initEditorView.posAtCoords(placeCursorAt, false) ?? 0,
                initEditorView.state.doc.length,
                (x) => x.toLowerCase(),
            )

            pos = cursor.next().value?.from
        }

        if (!pos || pos === -1) {
            pos = initEditorView.posAtCoords(placeCursorAt, false)
        }

        if (pos) {
            initEditorView.dispatch({
                selection: {
                    anchor: pos,
                },
                scrollIntoView: true,
            })
        }
    }, [ref, editorState])

    useEffect(() => {
        return () => {
            if (editorView) {
                editorView.destroy()
                setEditorView(undefined)
            }
        }
    }, [editorView])

    useEffect(() => {
        if (autoFocus && editorView) {
            editorView.focus()
        }
    }, [autoFocus, editorView])

    useEffect(() => {
        if (text === undefined) {
            return
        }

        if (!editorView) {
            return
        }

        let currText = editorView.state.doc.toString()
        if (text === currText) {
            return
        }

        editorView.dispatch({
            changes: { from: 0, to: currText.length, insert: text },
            annotations: [Annotation.define<boolean>().of(true)],
        })
    }, [text, editorView])
}
