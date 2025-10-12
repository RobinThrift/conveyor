import { SearchCursor } from "@codemirror/search"
import { Annotation, type ChangeSet, EditorState } from "@codemirror/state"
import { EditorView, type ViewUpdate } from "@codemirror/view"
import { type RefObject, useEffect, useMemo, useRef } from "react"

import type { AttachmentID } from "@/domain/Attachment"
import type { Tag } from "@/domain/Tag"

import { useAttachmentLoader } from "@/ui/attachments"
import { extensions } from "./extensions"

export function useCodeMirror({
    ref,
    id,
    text,
    autoFocus,
    placeCursorAt,
    autocomplete,
    vimModeEnabled,
    onCreateEditor,
    onChange,
    transferAttachment,
}: {
    ref: RefObject<HTMLDivElement | null>

    id: string
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
    let editorState = useRef<EditorState | undefined>(undefined)
    let editorView = useRef<EditorView | undefined>(undefined)

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
        if (!ref?.current) {
            return
        }

        if (editorState.current) {
            return () => {
                editorView.current?.destroy()
                editorState.current = undefined
                editorView.current = undefined
            }
        }

        editorState.current = EditorState.create({
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

        editorView.current = new EditorView({
            state: editorState.current,
            parent: ref.current,
        })
        onCreateEditor?.(editorView.current)

        if (!placeCursorAt) {
            return
        }

        let pos: number | null = null
        if (placeCursorAt.snippet) {
            let cursor = new SearchCursor(
                editorState.current.doc,
                placeCursorAt.snippet,
                editorView.current.posAtCoords(placeCursorAt, false) ?? 0,
                editorState.current.doc.length,
                (x) => x.toLowerCase(),
            )

            pos = cursor.next().value?.from
        }

        if (!pos || pos === -1) {
            pos = editorView.current.posAtCoords(placeCursorAt, false)
        }

        if (pos) {
            editorView.current.dispatch({
                selection: {
                    anchor: pos,
                },
                scrollIntoView: true,
            })
        }
    }, [ref.current, editorState])

    useEffect(() => {
        if (autoFocus && editorView.current) {
            editorView.current.focus()
        }
    }, [autoFocus])

    // biome-ignore lint/correctness/useExhaustiveDependencies: this is intentional
    useEffect(() => {
        if (text === undefined) {
            return
        }

        if (!editorView.current) {
            return
        }

        let currText = editorState.current?.doc.toString() ?? ""
        if (text === currText) {
            return
        }

        editorView.current?.dispatch({
            changes: { from: 0, to: currText.length, insert: text },
            annotations: [Annotation.define<boolean>().of(true)],
        })
    }, [id])
}
