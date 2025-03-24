import {
    EditorSelection,
    type Extension,
    StateEffect,
    StateField,
} from "@codemirror/state"
import {
    Decoration,
    type DecorationSet,
    EditorView,
    ViewPlugin,
} from "@codemirror/view"

import type { AttachmentID } from "@/domain/Attachment"
import { newID } from "@/domain/ID"
import { thumbhashFromFile } from "@/external/thumbhash"
import { html2md } from "@/lib/html2md"
import { fromThrowing } from "@/lib/result"

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

const startTransferEffect = StateEffect.define<{
    id: AttachmentID
    status: "transferring"
    from: number
    to: number
}>({
    map(st, mapping) {
        return {
            ...st,
            from: mapping.mapPos(st.from),
            to: mapping.mapPos(st.to),
        }
    },
})

const endTransferEffect = StateEffect.define<{
    id: AttachmentID
    status: "done" | "error"
    from: number
    to: number
}>({
    map(st, mapping) {
        return {
            ...st,
            from: mapping.mapPos(st.from),
            to: mapping.mapPos(st.to),
        }
    },
})

const markTransferring = (id: string) =>
    Decoration.mark({
        id,
        attributes: {
            class: "relative rounded-sm before:content-[''] before:animate-pulse before:absolute before:h-[130%] before:w-full before:rounded-sm before:bg-success/50",
        },
    })

const markError = (id: string) =>
    Decoration.mark({
        id,
        attributes: {
            class: "bg-danger/75 text-danger-contrast rounded-sm",
        },
    })

const transferStates = StateField.define<{
    decorations: DecorationSet
    states: Record<AttachmentID, "transferring" | "done" | "error">
}>({
    create() {
        return { decorations: Decoration.none, states: {} }
    },

    update(current, transaction) {
        let states = { ...current.states }
        let decorations = current.decorations.map(transaction.changes)
        for (let e of transaction.effects) {
            if (e.is(startTransferEffect)) {
                if (
                    states[e.value.id] === "done" ||
                    states[e.value.id] === "error"
                ) {
                    continue
                }

                states[e.value.id] = e.value.status

                decorations = decorations.update({
                    add: [
                        markTransferring(e.value.id).range(
                            e.value.from,
                            e.value.to,
                        ),
                    ],
                })
                continue
            }

            if (e.is(endTransferEffect)) {
                states[e.value.id] = e.value.status

                decorations = decorations.update({
                    filter: (from, to, value) => {
                        if ("id" in value.spec) {
                            return value.spec.id !== e.value.id
                        }
                        return !(from === e.value.from && to === e.value.to)
                    },
                })
                if (e.value.status === "error") {
                    decorations = decorations.update({
                        add: [
                            markError(e.value.id).range(
                                e.value.from,
                                e.value.to,
                            ),
                        ],
                    })
                }
            }
        }

        return { decorations, states }
    },

    provide(field) {
        return EditorView.decorations.from(field, (s) => s.decorations)
    },
})

export interface FileDropHandlerOptions {
    transferAttachment(attachment: {
        id: AttachmentID
        filename: string
        content: ArrayBufferLike
    }): Promise<void>
}

const fileDropHandlerExt = (opts: FileDropHandlerOptions) =>
    ViewPlugin.fromClass(
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

                if (!e.clipboardData.types.some((t) => t !== "text/plain")) {
                    return
                }

                e.preventDefault()

                let pos = Math.max(this.view.state.selection.main.from, 0)

                let uri = e.clipboardData.getData("text/uri-list")
                if (uri) {
                    let link = `[Link](${uri})`
                    let url = fromThrowing(() => new URL(uri))
                    if (url.ok) {
                        link = `[${url.value.host}${url.value.pathname}](${uri})`
                    }
                    this.view.dispatch({
                        changes: {
                            from: pos,
                            to: this.view.state.selection.main.to,
                            insert: link,
                        },
                        selection: EditorSelection.cursor(
                            this.view.state.selection.main.from + link.length,
                        ),
                    })
                    return
                }

                if (e.clipboardData.types.some((t) => t === "text/html")) {
                    let converted = html2md(
                        e.clipboardData.getData("text/html"),
                    )
                    this.view.dispatch({
                        changes: {
                            from: pos,
                            to: this.view.state.selection.main.to,
                            insert: converted,
                        },
                        selection: EditorSelection.cursor(
                            this.view.state.selection.main.from +
                                converted.length,
                        ),
                    })
                    return
                }

                this.startFileTransfers(
                    Array.from(e.clipboardData?.files ?? []),
                    pos,
                )
            }

            private async startFileTransfers(files: File[], pos: number) {
                let inserts: string[] = []
                let effects: StateEffect<any>[] = []

                let from = pos

                for (let file of files) {
                    let id = newID()

                    let insertText = `[${file.name}](attachment://${id})`
                    if (isImg(file.type)) {
                        let thumbhash = await thumbhashFromFile(file)
                        insertText = `![${file.name}](attachment://${id}?thumbhash=${thumbhash})`
                    }

                    let to = from + insertText.length

                    inserts.push(insertText)
                    effects.push(
                        startTransferEffect.of({
                            id,
                            status: "transferring",
                            from,
                            to,
                        }),
                    )

                    await this.startFileTransfer(file, id, from, to)

                    from = to + 1
                }

                this.view.dispatch({
                    effects,
                    changes: {
                        from: pos,
                        to: this.view.state.selection.main.to,
                        insert: inserts.join("\n"),
                    },
                    selection: EditorSelection.cursor(Math.max(from - 1, 0)),
                })
            }

            private async startFileTransfer(
                file: File,
                id: AttachmentID,
                from: number,
                to: number,
            ) {
                opts.transferAttachment({
                    id,
                    filename: file.name,
                    content: await file.arrayBuffer(),
                })
                    .then(() => {
                        this.view.dispatch({
                            effects: [
                                endTransferEffect.of({
                                    id,
                                    from,
                                    to,
                                    status: "done",
                                }),
                            ],
                        })
                    })
                    .catch(() => {
                        this.view.dispatch({
                            effects: [
                                endTransferEffect.of({
                                    id,
                                    from,
                                    to,
                                    status: "error",
                                }),
                            ],
                        })
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
        },
    )

export function fileDropHandler(opts: FileDropHandlerOptions): Extension {
    return [transferStates, droppedCursorPos, fileDropHandlerExt(opts)]
}

function isImg(type?: string): boolean {
    return type?.startsWith("image") ?? false
}
