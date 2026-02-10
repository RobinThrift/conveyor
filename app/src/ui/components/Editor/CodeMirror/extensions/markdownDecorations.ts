import { syntaxTree } from "@codemirror/language"
import {
    type EditorState,
    type RangeSet,
    RangeSetBuilder,
    StateField,
    type Text,
} from "@codemirror/state"
import { Decoration, EditorView, WidgetType } from "@codemirror/view"
import type { SyntaxNode } from "@lezer/common"

export const markdownDecorations = StateField.define<RangeSet<Decoration>>({
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

function buildDecorations(state: EditorState) {
    let decorations = new RangeSetBuilder<Decoration>()

    syntaxTree(state).iterate({
        enter: (cursor) => {
            if (cursor.name === "CustomBlockStart" || cursor.name === "CustomBlockEnd") {
                decorations.add(
                    cursor.from,
                    cursor.to,
                    Decoration.mark({
                        class: "tok-custom-block-delim",
                    }),
                )
                return
            }

            if (cursor.name === "CustomBlockArgs") {
                decorations.add(
                    cursor.from,
                    cursor.to,
                    Decoration.mark({
                        class: "tok-custom-block-args",
                    }),
                )
                return
            }

            if (cursor.name === "CustomBlockName") {
                decorations.add(
                    cursor.from,
                    cursor.to,
                    Decoration.mark({
                        class: "tok-custom-block-name",
                    }),
                )
                return
            }

            if (
                cursor.name === "Paragraph" &&
                cursor.node.parent?.type.name === "Document" &&
                !isSameLineAsPrevSibling(state.doc, cursor.node)
            ) {
                let line = state.doc.lineAt(cursor.from).from
                decorations.add(
                    line,
                    line,
                    Decoration.line({
                        class: "tok-paragraph",
                    }),
                )
                return
            }

            if (cursor.name === "ListMark") {
                let classes = "tok-list-mark"
                if (!Number.isNaN(Number.parseInt(state.sliceDoc(cursor.from, cursor.to), 10))) {
                    classes = " tok-list-numeric"
                }

                decorations.add(cursor.from, cursor.from, Decoration.line({ class: classes }))

                return
            }

            if (cursor.name === "CodeMark" && cursor.node.parent?.name === "FencedCode") {
                let classes = "tok-fenced-code-mark"
                if (cursor.node.prevSibling?.name === "CodeText") {
                    classes = "tok-fenced-code-end-mark"
                }

                decorations.add(
                    cursor.from,
                    cursor.from,
                    Decoration.line({ attributes: { class: classes, spellcheck: "false" } }),
                )
                return
            }

            if (cursor.name === "CodeText") {
                let first = state.doc.lineAt(cursor.from)
                let last = state.doc.lineAt(cursor.to)
                for (let i = first.number; i <= last.number; i++) {
                    decorations.add(
                        state.doc.line(i).from,
                        state.doc.line(i).from,
                        Decoration.line({
                            attributes: { class: "tok-fenced-code", spellcheck: "false" },
                        }),
                    )
                }
                return
            }

            if (cursor.name === "Blockquote") {
                decorations.add(
                    cursor.from,
                    cursor.to,
                    Decoration.mark({ class: "tok-blockquote" }),
                )
            }

            if (cursor.name === "InlineCode") {
                decorations.add(
                    cursor.from,
                    cursor.to,
                    Decoration.mark({
                        class: "tok-monospace",
                    }),
                )
            }

            if (withinRange(state.selection.main, cursor)) {
                return
            }

            if (cursor.name === "HorizontalRule") {
                decorations.add(
                    cursor.from,
                    cursor.from,
                    Decoration.line({
                        class: "tok-horizontalrule",
                    }),
                )
                return
            }

            if (cursor.name === "URL" && cursor.node.parent?.name !== "Link") {
                decorations.add(
                    cursor.to,
                    cursor.to,
                    Decoration.widget({
                        widget: new LinkWidget({
                            href: state.sliceDoc(cursor.from, cursor.to),
                        }),
                    }),
                )
                return
            }

            if (cursor.name === "Link") {
                decorations.add(
                    cursor.from,
                    cursor.to,
                    Decoration.mark({ class: "cm-hide-token md-link" }),
                )

                return
            }

            if (cursor.name === "HeaderMark") {
                if (cursor.node?.parent && withinRange(state.selection.main, cursor.node?.parent)) {
                    return
                }
                decorations.add(
                    cursor.from,
                    cursor.to,
                    Decoration.mark({
                        class: "cm-hide-token",
                    }),
                )
                return
            }

            if (cursor.name === "Emphasis") {
                decorations.add(
                    cursor.from,
                    cursor.to,
                    Decoration.mark({
                        class: "cm-hide-token",
                        tagName: "em",
                    }),
                )
                return
            }

            if (cursor.name === "StrongEmphasis") {
                decorations.add(
                    cursor.from,
                    cursor.to,
                    Decoration.mark({
                        class: "cm-hide-token",
                        tagName: "strong",
                    }),
                )
                return
            }

            if (cursor.name === "Blockquote") {
                decorations.add(
                    cursor.from,
                    cursor.to,
                    Decoration.mark({
                        class: "cm-hide-token",
                    }),
                )
                return
            }

            if (cursor.name === "InlineCode") {
                decorations.add(
                    cursor.from,
                    cursor.to,
                    Decoration.mark({
                        class: "tok-monospace cm-hide-token",
                        tagName: "code",
                    }),
                )
                return
            }

            if (cursor.name === "Strikethrough") {
                decorations.add(
                    cursor.from,
                    cursor.to,
                    Decoration.mark({
                        class: "line-through cm-hide-token",
                        tagName: "del",
                    }),
                )
                return
            }
        },
        leave: (cursor) => {
            if (withinRange(state.selection.main, cursor)) {
                return
            }

            if (cursor.name === "Link") {
                let href = state.sliceDoc(cursor.from, cursor.to)
                let urlStart = href.indexOf("](")
                if (urlStart !== 1 && href[urlStart + 2] !== "^") {
                    decorations.add(
                        cursor.to,
                        cursor.to,
                        Decoration.widget({
                            widget: new LinkWidget({
                                href: href.substring(urlStart + 2, href.length - 1),
                            }),
                        }),
                    )
                }

                return
            }
        },
    })

    return decorations.finish()
}

function withinRange(a: { from: number; to: number }, b: { from: number; to: number }): boolean {
    return a.from <= b.to && b.from <= a.to
}

class LinkWidget extends WidgetType {
    private readonly _href: string
    private _dom?: HTMLAnchorElement

    constructor({ href }: { href: string }) {
        super()
        this._href = href
    }

    eq(widget: WidgetType): boolean {
        return this._href === (widget as LinkWidget)._href
    }

    toDOM() {
        this._dom = document.createElement("a")
        this._dom.className = "cm-anchor"
        this._dom.href = this._href
        this._dom.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256"><path d="M165.66,90.34a8,8,0,0,1,0,11.32l-64,64a8,8,0,0,1-11.32-11.32l64-64A8,8,0,0,1,165.66,90.34ZM215.6,40.4a56,56,0,0,0-79.2,0L106.34,70.45a8,8,0,0,0,11.32,11.32l30.06-30a40,40,0,0,1,56.57,56.56l-30.07,30.06a8,8,0,0,0,11.31,11.32L215.6,119.6a56,56,0,0,0,0-79.2ZM138.34,174.22l-30.06,30.06a40,40,0,1,1-56.56-56.57l30.05-30.05a8,8,0,0,0-11.32-11.32L40.4,136.4a56,56,0,0,0,79.2,79.2l30.06-30.07a8,8,0,0,0-11.32-11.31Z"></path></svg>`
        this._dom.target = "_blank"

        return this._dom
    }
}

function isSameLineAsPrevSibling(doc: Text, node: SyntaxNode): boolean {
    if (!node.prevSibling) {
        return false
    }

    let prevSiblingLine = doc.lineAt(node.prevSibling.from).from
    let ownLine = doc.lineAt(node.from).from

    return prevSiblingLine === ownLine
}
