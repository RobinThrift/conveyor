import { EditorSelection } from "@codemirror/state"
import type { EditorView } from "@codemirror/view"

import { newID } from "@/domain/ID"
import { html2md } from "@/lib/html2md"
import { extensionForMimeType } from "@/lib/mimeTypes"
import { fromThrowing } from "@/lib/result"
import { insertAttachment } from "./attachments"
import { insertLink } from "./links"

export type PasteItem =
    | {
          type: "text"
          data: string
      }
    | {
          type: "uri"
          data: string
      }
    | {
          type: "blob"
          mime: string
          data: () => Promise<Blob>
      }

export async function pasteFromClipboard(view: EditorView, items: PasteItem[]) {
    for (let item of items) {
        if (item.type === "text") {
            let [_, urlErr] = fromThrowing(() => new URL(item.data))
            if (!urlErr) {
                insertLink(view, {
                    uri: item.data,
                    from: view.state.selection.main.from,
                    to: view.state.selection.main.to,
                })
                return
            }

            pastePlainText(view, {
                text: item.data,
                from: view.state.selection.main.from,
                to: view.state.selection.main.to,
            })
            return
        }

        if (item.type === "uri") {
            insertLink(view, {
                uri: item.data,
                from: view.state.selection.main.from,
                to: view.state.selection.main.to,
            })
            return
        }

        if (item.mime === "text/html") {
            pastePlainText(view, {
                text: html2md(await item.data().then((b) => b.text())),
                from: view.state.selection.main.from,
                to: view.state.selection.main.to,
            })
            return
        }

        let id = newID()
        insertAttachment(view, {
            filename: `pasted_item_${id}.${extensionForMimeType(item.mime)}`,
            id,
            mime: item.mime || "application/octet-stream",
            data: await (await item.data()).arrayBuffer(),
            from: view.state.selection.main.from,
        })
    }
}

export function pastePlainText(
    view: EditorView,
    { from, to, text }: { from: number; to: number; text: string },
) {
    view.dispatch({
        changes: {
            from,
            to: to || undefined,
            insert: text,
        },
        selection: from === to ? EditorSelection.cursor(from + text.length) : undefined,
    })
}
