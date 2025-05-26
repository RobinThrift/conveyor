import { EditorSelection } from "@codemirror/state"
import type { EditorView } from "@codemirror/view"

import { newID } from "@/domain/ID"
import { thumbhashFromFile } from "@/external/thumbhash"

import { startTransferEffect } from "../CodeMirror/extensions/attachments"

export async function insertAttachment(
    view: EditorView,
    {
        id,
        filename,
        mime,
        data,
        from,
    }: {
        id?: string
        filename: string
        mime: string
        data: ArrayBuffer
        from: number
    },
) {
    id = id ?? newID()

    let insertText = `[${filename}](attachment://${id})`
    if (isImg(mime)) {
        try {
            let thumbhash = await thumbhashFromFile(
                new Blob([data], { type: mime }),
            )
            insertText = `![${filename}](attachment://${id}?thumbhash=${thumbhash})`
        } catch (err) {
            console.error("error generating thumbhash for image: ", err)
            insertText = `![${filename}](attachment://${id})`
        }
    }

    if (from !== 0) {
        insertText = `\n${insertText}`
    }

    let to = from + insertText.length

    if (to < view.state.doc.length) {
        insertText = `${insertText}\n`
    }

    view.dispatch({
        effects: [
            startTransferEffect.of({
                id: newID(),
                filename,
                mime,
                data,
                status: "transferring",
                from,
                to,
            }),
        ],
        changes: {
            from,
            to: view.state.selection.main.to || undefined,
            insert: insertText,
        },
        selection: EditorSelection.cursor(to),
    })
}

function isImg(type?: string): boolean {
    return type?.startsWith("image") ?? false
}
