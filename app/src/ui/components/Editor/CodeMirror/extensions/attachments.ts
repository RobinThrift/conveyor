import { type Extension, StateEffect, StateField } from "@codemirror/state"
import { Decoration, type DecorationSet, EditorView, ViewPlugin } from "@codemirror/view"

import type { AttachmentID } from "@/domain/Attachment"

export type StartTransferEffectValue = {
    id: AttachmentID
    filename: string
    mime: string
    data: ArrayBuffer
    status: "transferring"
    from: number
    to: number
}

export const startTransferEffect = StateEffect.define<StartTransferEffectValue>({
    map(st, mapping) {
        return {
            ...st,
            from: mapping.mapPos(st.from),
            to: mapping.mapPos(st.to),
        }
    },
})
export const endTransferEffect = StateEffect.define<{
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

export interface AttachmentsPluginOpts {
    transferAttachment(attachment: {
        id: AttachmentID
        filename: string
        data: ArrayBufferLike
    }): Promise<void>
}

export function attachments(opts: AttachmentsPluginOpts): Extension {
    return [transferState, attachmentsPlugin(opts)]
}

const attachmentsPlugin = (opts: AttachmentsPluginOpts) =>
    ViewPlugin.define(() => ({
        update({ transactions, view }) {
            let effects = transactions.flatMap((t) => t.effects)

            for (let effect of effects) {
                if (effect.is(startTransferEffect)) {
                    this._handleStartTransferEffect(view, effect)
                    return
                }
            }
        },

        _handleStartTransferEffect(
            view: EditorView,
            effect: StateEffect<StartTransferEffectValue>,
        ) {
            opts.transferAttachment({
                id: effect.value.id,
                filename: effect.value.filename,
                data: effect.value.data,
            })
                .then(() => {
                    view.dispatch({
                        effects: [
                            endTransferEffect.of({
                                ...effect.value,
                                status: "done",
                            }),
                        ],
                    })
                })
                .catch((err) => {
                    console.error("error transferring attachment: ", err)
                    view.dispatch({
                        effects: [
                            endTransferEffect.of({
                                ...effect.value,
                                status: "error",
                            }),
                        ],
                    })
                    view
                })
        },
    }))

const transferState = StateField.define<{
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
                if (states[e.value.id] === "done" || states[e.value.id] === "error") {
                    continue
                }

                states[e.value.id] = e.value.status

                decorations = decorations.update({
                    add: [markTransferring(e.value.id).range(e.value.from, e.value.to + 1)],
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
                        add: [markError(e.value.id).range(e.value.from, e.value.to + 1)],
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

const markTransferring = (id: string) =>
    Decoration.mark({
        id,
        attributes: {
            class: "relative rounded-xs before:content-[''] before:animate-pulse before:absolute before:h-[130%] before:w-full before:rounded-xs before:bg-success/50",
        },
    })

const markError = (id: string) =>
    Decoration.mark({
        id,
        attributes: {
            class: "bg-danger/75 text-danger-contrast rounded-xs",
        },
    })
