import type { EditorView } from "@codemirror/view"
import { Vim } from "@replit/codemirror-vim"

import * as eventbus from "@/ui/eventbus"

Vim.defineEx("write", "w", (cm: { cm6: EditorView }) => {
    eventbus.emit(`vim:write:${cm.cm6.dom.parentElement?.id ?? "global"}`)
})

Vim.defineEx("wquit", "wq", (cm: { cm6: EditorView }) => {
    eventbus.emit(`vim:write:${cm.cm6.dom.parentElement?.id ?? "global"}`)
})

Vim.defineEx("quit", "q", (cm: { cm6: EditorView }) => {
    eventbus.emit(`vim:quit:${cm.cm6.dom.parentElement?.id ?? "global"}`)
})

Vim.defineEx("cquit", "cq", (cm: { cm6: EditorView }) => {
    eventbus.emit(`vim:quit:${cm.cm6.dom.parentElement?.id ?? "global"}`)
})

Vim.map("A", "g$a", "normal")
Vim.map("I", "g0i", "normal")

Vim.map("j", "gj", "normal")
Vim.map("j", "gj", "visual")

Vim.map("k", "gk", "normal")
Vim.map("k", "gk", "visual")

export { vim } from "@replit/codemirror-vim"
