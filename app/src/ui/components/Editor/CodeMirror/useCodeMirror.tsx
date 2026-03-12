import { type ChangeSet, EditorState } from "@codemirror/state"
import { EditorView, type ViewUpdate } from "@codemirror/view"
import { type RefObject, useEffect, useMemo, useRef } from "react"

import type { AttachmentID } from "@/domain/Attachment"
import type { Tag } from "@/domain/Tag"

import { useAttachmentLoader } from "@/ui/attachments"
import { extensions } from "./extensions"

export function useCodeMirror({
    ref,
    text,
    autoFocus,
    autocomplete,
    placeCursorAt,
    vimModeEnabled,
    onCreateEditor,
    onChange,
    transferAttachment,
}: {
    ref: RefObject<HTMLDivElement | null>

    text: string

    autoFocus?: boolean

    autocomplete?: {
        tags?: Tag[]
    }

    placeCursorAt?: { x?: number; y?: number; snippet?: string; pageTop?: number; pos?: number }

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

        let { scrollTo, selection } = positionCursor(placeCursorAt)

        editorView.current = new EditorView({
            state: editorState.current,
            parent: ref.current,
            selection: selection ? { anchor: selection } : undefined,
            scrollTo,
        })

        if (selection) {
            editorView.current.dispatch({
                selection: { anchor: selection },
            })
        }
        onCreateEditor?.(editorView.current)

        return () => {
            editorView.current?.destroy()
            editorState.current = undefined
            editorView.current = undefined
        }
    }, [])

    useEffect(() => {
        if (autoFocus && editorView.current) {
            editorView.current.focus()
        }
    }, [autoFocus])
}

function positionCursor(placeCursorAt?: {
    x?: number
    y?: number
    snippet?: string
    pageTop?: number
    pos?: number
}): { selection?: number; scrollTo?: ReturnType<typeof EditorView.scrollIntoView> } {
    if (!placeCursorAt) {
        return {}
    }

    if (placeCursorAt.pos) {
        return {
            selection: placeCursorAt.pos,
            scrollTo: EditorView.scrollIntoView(placeCursorAt.pos, { y: "start", yMargin: 20 }),
        }
    }

    return {}
}
