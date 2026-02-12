import { EditorSelection } from "@codemirror/state"
import type { EditorView } from "@codemirror/view"

import { imageBlobToSrc } from "@/domain/Attachment"
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
        data: Uint8Array<ArrayBuffer>
        from: number
    },
) {
    id = id ?? newID()

    let insertText = `[${filename}](attachment://${id})`
    if (isImg(mime)) {
        let imgURL = id
        let imgURLParams = new URLSearchParams()

        try {
            let img = new Image()
            img.src = imageBlobToSrc({ data, mime })
            await img.decode()
            imgURLParams.set("width", img.width.toString())
            imgURLParams.set("height", img.height.toString())
        } catch (err) {
            console.error("error decoding image: ", err)
        }

        try {
            let thumbhash = await thumbhashFromFile(new Blob([data], { type: mime }))
            imgURLParams.set("thumbhash", thumbhash)
        } catch (err) {
            console.error("error generating thumbhash for image: ", err)
        }

        if (imgURLParams.size !== 0) {
            imgURL = `${id}?${imgURLParams.toString()}`
        }

        insertText = `![](attachment://${imgURL})`
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
                id,
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
