import type { EditorView } from "@codemirror/view"

export function copyToClipboard(view: EditorView) {
    let from = view.state.selection.main.from
    let to = view.state.selection.main.to

    if (from === to) {
        return
    }

    let text = view.state.doc.sliceString(from, to)

    navigator.clipboard.writeText(text)
}
