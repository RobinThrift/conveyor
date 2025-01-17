import * as eventbus from "@/eventbus"
import { randomID } from "@/helper"
import { SearchCursor } from "@codemirror/search"
import {
    type Extension,
    type Range,
    StateEffect,
    StateField,
} from "@codemirror/state"
import {
    Decoration,
    type DecorationSet,
    type EditorView,
    ViewPlugin,
    type ViewUpdate,
    WidgetType,
} from "@codemirror/view"

const setDroppedPos = StateEffect.define<number | null>({
    map(pos, mapping) {
        return pos == null ? null : mapping.mapPos(pos)
    },
})

export const droppedCursorPos = StateField.define<number | null>({
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

const uploadingRegex = /!?\[.*?\]\(uploading: .+?_.+?\)/g

class FileUploadStatusIcon extends WidgetType {
    constructor(
        private readonly state: {
            from: number
        },
    ) {
        super()
        this.state = state
    }

    eq(other: FileUploadStatusIcon) {
        return this.state.from === other.state.from
    }

    toDOM() {
        let indicator = document.createElement("span")
        indicator.className = "relative inline-flex ml-1 h-2.5 w-2.5"

        let pinger = document.createElement("span")
        pinger.className =
            "animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"
        indicator.appendChild(pinger)

        let bg = document.createElement("span")
        bg.className =
            "relative inline-flex rounded-full h-2.5 w-2.5 bg-success"
        indicator.appendChild(bg)

        return indicator
    }
}

function fileUploadStatusDecorations(view: EditorView) {
    let widgets: Array<Range<Decoration>> = []
    let doc = view.state.doc.toString()

    for (
        let match = uploadingRegex.exec(doc);
        match !== null;
        match = uploadingRegex.exec(doc)
    ) {
        let from = match.index
        let to = from + match[0].length
        let widget = Decoration.widget({
            widget: new FileUploadStatusIcon({
                from,
            }),
            side: 1,
        })
        widgets.push(widget.range(to))
    }

    return Decoration.set(widgets)
}

const fileDropHandlerExt = ViewPlugin.fromClass(
    class {
        private dropPositions = new Map<string, number>()
        decorations: DecorationSet
        unsub: () => void

        constructor(readonly view: EditorView) {
            this.decorations = fileUploadStatusDecorations(view)

            this.unsub = eventbus.on("attachments:upload:done", (evt) => {
                let cursor = new SearchCursor(
                    this.view.state.doc,
                    `(uploading: ${evt.taskID})`,
                    this.dropPositions.get(evt.taskID),
                )

                let found = cursor.next().value
                if (!found) {
                    return
                }

                this.view.dispatch({
                    changes: [
                        {
                            from: found.from,
                            to: found.to,
                            insert: `(${evt.attachment?.url})`,
                        },
                    ],
                })
            })
        }

        destroy() {
            this.unsub()
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = fileUploadStatusDecorations(update.view)
            }
        }

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

            let insertStrings = [""]

            Array.from(e.dataTransfer.files).forEach((file) => {
                let localID = `${file.name}_${randomID()}`
                this.dropPositions.set(localID, pos)
                eventbus.emit("attachments:upload:start", {
                    taskID: localID,
                    filename: file.name,
                    data: file.stream(),
                })

                if (isImgFile(file.type)) {
                    insertStrings.push(`![${file.name}](uploading: ${localID})`)
                } else {
                    insertStrings.push(`[${file.name}](uploading: ${localID})`)
                }
            })

            this.view.dispatch({
                changes: {
                    from: pos,
                    insert: insertStrings.join("\n"),
                },
            })
        }

        onPaste(e: ClipboardEvent) {
            if (!e.clipboardData) {
                return
            }

            if (!e.clipboardData.types.some((t) => t !== "text/plain")) {
                return
            }

            e.preventDefault()

            let pos = Math.max(this.view.state.selection.main.anchor - 1, 0)

            let insertStrings = [""]

            Array.from(e.clipboardData?.files ?? []).forEach((file) => {
                let localID = `${file.name}_${randomID()}`
                this.dropPositions.set(localID, pos)
                eventbus.emit("attachments:upload:start", {
                    taskID: localID,
                    filename: file.name,
                    data: file.stream(),
                })

                if (isImgFile(file.type)) {
                    insertStrings.push(`![${file.name}](uploading: ${localID})`)
                } else {
                    insertStrings.push(`[${file.name}](uploading: ${localID})`)
                }
            })

            this.view.dispatch({
                changes: {
                    from: pos,
                    insert: insertStrings.join("\n"),
                },
            })
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
        decorations: (v) => v.decorations,
    },
)

export function fileDropHandler(): Extension {
    return [droppedCursorPos, fileDropHandlerExt]
}

function isImgFile(type?: string): boolean {
    switch (type) {
        case "image/png":
            return true
    }

    return false
}
