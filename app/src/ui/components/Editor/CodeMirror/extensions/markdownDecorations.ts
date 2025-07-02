import { syntaxTree } from "@codemirror/language"
import { type EditorState, type Range, StateField } from "@codemirror/state"
import { Decoration, EditorView } from "@codemirror/view"
import type { DecorationSet } from "@codemirror/view"

export const markdownDecorations = StateField.define<DecorationSet>({
    create(state) {
        return buildDecorations(state)
    },

    update(decorations, transaction) {
        if (transaction.docChanged || transaction.selection) {
            return buildDecorations(transaction.state)
        }
        return decorations.map(transaction.changes)
    },

    provide: (f) => [EditorView.decorations.from(f)],
})

const nodesToHide = new Set(["Emphasis", "StrongEmphasis"])

function buildDecorations(state: EditorState) {
    let decorations: Range<Decoration>[] = []
    syntaxTree(state).iterate({
        enter: (node) => {
            if (withinRange(state.selection.main, node)) {
                return
            }

            if (node.name === "HeaderMark") {
                if (node.node?.parent && withinRange(state.selection.main, node.node?.parent)) {
                    return
                }
                let mark = Decoration.mark({
                    class: "cm-hide-token",
                })
                decorations.push(mark.range(node.from, node.to))
            }

            if (nodesToHide.has(node.name)) {
                let mark = Decoration.mark({
                    class: "cm-hide-token",
                })
                decorations.push(mark.range(node.from, node.to))
                return
            }

            if (node.name === "Blockquote") {
                let mark = Decoration.mark({
                    class: "tok-blockquote cm-hide-token",
                })
                decorations.push(mark.range(node.from, node.to))
                return
            }

            if (node.name === "InlineCode") {
                let mark = Decoration.mark({
                    class: "tok-monospace cm-hide-token",
                })
                decorations.push(mark.range(node.from, node.to))
                return
            }

            if (node.name === "Strikethrough") {
                let mark = Decoration.mark({
                    class: "line-through cm-hide-token",
                })
                decorations.push(mark.range(node.from, node.to))
                return
            }
        },
    })
    return Decoration.set(decorations)
}

function withinRange(a: { from: number; to: number }, b: { from: number; to: number }): boolean {
    return a.from <= b.to && b.from <= a.to
}
