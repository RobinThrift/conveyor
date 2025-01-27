import { EditorSelection } from "@codemirror/state"
import type { EditorView } from "@codemirror/view"

export const toggleBold = toggleAround("*")

export const toggleItalics = toggleAround("_")

export const toggleMonospace = toggleAround("`")

export function insertLink(view: EditorView) {
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

export function toggleAround(char: string) {
    return (view: EditorView) => {
        view.dispatch(
            view.state.changeByRange((range) => {
                let from = range.from
                let to = range.to
                let hasSelection = from !== to

                let hasModifier = false

                if (!hasSelection) {
                    let word = view.state.wordAt(from)
                    from = word?.from ?? from
                    to = word?.to ?? to
                    if (
                        view.state.doc.sliceString(from - 1, from) === char &&
                        view.state.doc.sliceString(to, to + 1) === char
                    ) {
                        from = from - 1
                        hasModifier = true
                    }
                } else {
                    if (
                        view.state.doc.sliceString(from, from + 1) === char &&
                        view.state.doc.sliceString(to - 1, to) === char
                    ) {
                        to = to - 1
                        hasModifier = true
                    }
                }

                if (hasModifier) {
                    return {
                        changes: [
                            { from: from, to: from + 1, insert: "" },
                            { from: to, to: to + 1, insert: "" },
                        ],
                        range: hasSelection
                            ? EditorSelection.range(from, to - 1)
                            : EditorSelection.cursor(to - 1),
                    }
                }

                return {
                    changes: [
                        { from: from, insert: char },
                        { from: to, insert: char },
                    ],
                    range: hasSelection
                        ? EditorSelection.range(from, to + 2)
                        : EditorSelection.cursor(to + 2),
                }
            }),
        )
    }
}
