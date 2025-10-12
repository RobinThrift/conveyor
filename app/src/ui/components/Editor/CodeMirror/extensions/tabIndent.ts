import { indentLess, indentMore } from "@codemirror/commands"
import { keymap } from "@codemirror/view"

export const tabIndent = keymap.of([
    {
        key: "Tab",
        run: indentMore,
    },
    {
        key: "Shift-Tab",
        run: indentLess,
    },
])
