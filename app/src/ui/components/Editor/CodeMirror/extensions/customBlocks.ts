import type { Completion, CompletionContext, CompletionSource } from "@codemirror/autocomplete"
import { syntaxTree } from "@codemirror/language"
import { EditorSelection, type StateCommand } from "@codemirror/state"
import type { KeyBinding } from "@codemirror/view"

const availBlocks = ["link-preview", "details"]

const customBlockStartRegex = /\/\/\/\s([\w-]+)/

export function customBlockAutocompleteSource(blocks: string[] = availBlocks): CompletionSource {
    let completions: Completion[] = blocks.map((block) => ({ label: block }))

    return (context: CompletionContext) => {
        let word = context.matchBefore(customBlockStartRegex)

        if (!word) {
            return null
        }

        if (word && word.from === word.to && !context.explicit) {
            return null
        }

        return {
            from: (word?.from ?? 0) + 4,
            options: completions,
        }
    }
}

const addClosingMarks: StateCommand = ({ state, dispatch }) => {
    let pos = state.selection.main.head
    if (pos === 0) {
        return false
    }

    let node = syntaxTree(state).resolveInner(pos, -1)
    if (node?.type.name !== "CustomBlockName") {
        return false
    }

    let nodePos = node.from
    let nextBlockStart = -1
    let nextBlockEnd = -1

    for (let child of node.parent?.getChildren("CustomBlockName") ?? []) {
        if (child.from > nodePos) {
            nextBlockStart = child.from
            break
        }
    }

    if (nextBlockStart === -1) {
        for (let child of node.parent?.getChildren("CustomBlock") ?? []) {
            if (child.from > nodePos) {
                nextBlockStart = child.from
                break
            }
        }
    }

    for (let child of node.parent?.parent?.getChildren("CustomBlockEnd") ?? []) {
        if (child.from > nodePos) {
            nextBlockEnd = child.from
            break
        }
    }

    if (nextBlockStart === -1 && nextBlockEnd !== -1) {
        return false
    }

    let insert = "\n///"

    dispatch(
        state.update(
            {
                selection: EditorSelection.cursor(state.selection.main.to),
                changes: [
                    {
                        insert,
                        from: state.selection.main.to,
                    },
                ],
            },
            { scrollIntoView: true, userEvent: "insert.custom-block-end" },
        ),
    )

    return false
}

export const customBlocksKeymap: readonly KeyBinding[] = [{ key: "Enter", run: addClosingMarks }]
