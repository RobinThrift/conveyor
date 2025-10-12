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

Vim.defineAction("centerview", ({ cm6: view }, _, vim) => {
    if (vim.mode && vim.mode !== "normal") {
        return
    }

    let pos = view.state.selection.main.from
    let el = view.domAtPos(pos)
    if (!el) {
        return
    }

    let node = el.node as HTMLElement

    if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement as HTMLElement
    }

    let vh = window.visualViewport?.height ?? window.screen.height
    let offsetTop = node.offsetTop

    let scrollTop = offsetTop - vh / 2

    window.scrollTo({
        top: Math.max(scrollTop, 0),
        left: 0,
        behavior: "instant",
    })
})
Vim.mapCommand("zz", "action", "centerview", [], {})

export { vim } from "@replit/codemirror-vim"
