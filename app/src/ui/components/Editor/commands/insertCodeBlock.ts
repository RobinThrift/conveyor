import { syntaxTree } from "@codemirror/language"
import { EditorSelection } from "@codemirror/state"
import type { EditorView } from "@codemirror/view"

export function insertCodeBlock(view: EditorView) {
    let nodeType = syntaxTree(view.state).resolveInner(view.state.selection.main.from, -1)?.type
        ?.name
    if (nodeType === "FencedCode" || nodeType === "CodeText") {
        return
    }

    view.dispatch(
        view.state.changeByRange((range) => {
            let from = range.from
            let to = range.to
            let hasSelection = from !== to

            return {
                changes: [
                    { from: from, insert: "\n```" },
                    { from: to, insert: "\n```" },
                ],
                range: hasSelection
                    ? EditorSelection.range(from - 3, to + 4)
                    : EditorSelection.cursor(to + 4),
            }
        }),
    )
}
