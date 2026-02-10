import { syntaxTree } from "@codemirror/language"
import {
    EditorSelection,
    type EditorState,
    type Extension,
    type Transaction,
} from "@codemirror/state"
import { EditorView } from "@codemirror/view"

export function codeblocks(): Extension {
    return [autocloseInputHandler]
}

const autocloseInputHandler = EditorView.inputHandler.of((view, from, to, insert) => {
    if (view.state.readOnly) {
        return false
    }

    if (insert !== "`") {
        return false
    }

    if (to < 2) {
        return false
    }

    let prev: string
    if (from - 2 === 0) {
        prev = `\n${view.state.sliceDoc(from - 2, to)}`
    } else {
        prev = view.state.sliceDoc(from - 3, to)
    }

    if (prev !== "\n``") {
        return false
    }

    let nodeType = syntaxTree(view.state).resolveInner(from, -1)?.type?.name
    if (nodeType === "FencedCode" || nodeType === "CodeText") {
        return false
    }

    view.dispatch(insertCodeBlockClose(view.state, insert))

    return true
})

export function insertCodeBlockClose(state: EditorState, insert: string): Transaction {
    return state.update(
        {
            selection: EditorSelection.cursor(state.selection.main.to + 1),
            changes: [
                {
                    insert: insert,
                    from: state.selection.main.to,
                },
                {
                    insert: "\n```",
                    from: state.selection.main.to,
                },
            ],
        },
        {
            scrollIntoView: false,
            userEvent: "input.type",
        },
    )
}
