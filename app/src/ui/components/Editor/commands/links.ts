import { EditorSelection } from "@codemirror/state"
import type { EditorView } from "@codemirror/view"

import { fromThrowing } from "@/lib/result"

export function insertLink(
    view: EditorView,
    { from, to, uri }: { from: number; to: number; uri: string },
) {
    let link = `[Link](${uri})`
    let url = fromThrowing(() => new URL(uri))
    if (url.ok) {
        link = `[${url.value.host}${url.value.pathname}](${uri})`
    }

    view.dispatch({
        changes: {
            from,
            to,
            insert: link,
        },
        selection:
            from === to
                ? EditorSelection.cursor(from + link.length)
                : undefined,
    })
}

export function wrapAsLink(view: EditorView) {
    let from = view.state.selection.main.from
    let to = view.state.selection.main.to

    if (from === to) {
        let word = view.state.wordAt(from)
        from = word?.from ?? from
        to = word?.to ?? to
    }

    view.dispatch({
        changes: [
            { from: from, insert: "[" },
            { from: to, insert: "]()" },
        ],
        selection: EditorSelection.cursor(to + 3),
    })
}
