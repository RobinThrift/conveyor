import { type Extension, StateEffect, StateField } from "@codemirror/state"
import { type EditorView, ViewPlugin } from "@codemirror/view"

import { insertAttachment } from "../../commands/attachments"

const fileDropHandlerExt = ViewPlugin.fromClass(
    class {
        constructor(readonly view: EditorView) {}

        onDrop(e: DragEvent) {
            if (!e.dataTransfer || !e.dataTransfer?.files) {
                return
            }

            e.preventDefault()

            let pos = this.view.posAtCoords({
                x: e.clientX,
                y: e.clientY,
            })

            if (!pos) {
                return
            }

            this.startFileTransfers(Array.from(e.dataTransfer.files), pos)
        }

        onPaste(e: ClipboardEvent) {
            if (!e.clipboardData) {
                return
            }

            let isTextData = e.clipboardData.types.some((t) => t.startsWith("text/"))
            if (isTextData) {
                return
            }

            e.preventDefault()

            this.startFileTransfers(
                Array.from(e.clipboardData?.files ?? []),
                Math.max(this.view.state.selection.main.from, 0),
            )
        }

        private async startFileTransfers(files: File[], from: number) {
            for (let file of files) {
                let data = await file.arrayBuffer()

                insertAttachment(this.view, {
                    filename: file.name,
                    mime: file.type,
                    data,
                    from,
                })
            }
        }
    },
    {
        eventObservers: {
            drop(e) {
                this.onDrop(e)
            },
            paste(e) {
                this.onPaste(e)
            },
        },
    },
)

export function fileDropHandler(): Extension {
    return [droppedCursorPos, fileDropHandlerExt]
}

const setDroppedPos = StateEffect.define<number | null>({
    map(pos, mapping) {
        return pos == null ? null : mapping.mapPos(pos)
    },
})

const droppedCursorPos = StateField.define<number | null>({
    create() {
        return null
    },

    update(pos, tr) {
        return tr.effects.reduce(
            (pos, e) => (e.is(setDroppedPos) ? e.value : pos),
            pos ? tr.changes.mapPos(pos) : null,
        )
    },
})
