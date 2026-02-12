import type { Text, TransactionSpec } from "@codemirror/state"
import type { EditorView } from "@codemirror/view"
import { type Pos, Vim } from "@replit/codemirror-vim"

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

Vim.unmap("s", "normal")
Vim.unmap("s", "visual")

Vim.defineOption(":surround:from:", -1, "number")
Vim.defineOption(":surround:to:", -1, "number")
Vim.defineOption(":surround:char:", "", "string")

Vim.defineOperator("addArround", (cm, _args, ranges, oldAnchor, _newHead) => {
    if (!ranges) {
        return
    }

    let from = indexFromPos(cm.cm6.state.doc, ranges[0].anchor)
    let to = indexFromPos(cm.cm6.state.doc, ranges[0].head)

    if (from === null || to === null) {
        return
    }

    Vim.setOption(":surround:from:", from, cm)
    Vim.setOption(":surround:to:", to, cm)

    Vim.handleKey(cm, "\0sa", "")
    cm.state.vim.status = "sa"

    return oldAnchor
})

Vim.defineAction("_addAround", (cm, params) => {
    let wrapWith = params.selectedCharacter
    if (!wrapWith) {
        return
    }

    let from: number = Vim.getOption(":surround:from:", cm)
    let to: number = Vim.getOption(":surround:to:", cm)

    if (from === -1 || to === -1) {
        return
    }

    Vim.setOption(":surround:from:", -1, cm)
    Vim.setOption(":surround:to:", -1, cm)

    let view = cm.cm6

    let tx: TransactionSpec = {
        changes: [
            { from, insert: wrapWith },
            { from: to, insert: wrapWith },
        ],
    }

    view.dispatch(tx)
})

Vim.mapCommand("sa", "operator", "addArround", [], {})

Vim.mapCommand("\0sa<character>", "action", "_addAround", [], {
    isEdit: true,
})

Vim.defineAction("replaceArround", (cm, params) => {
    console.log("replaceArround", params)
    if (!params.selectedCharacter) {
        return
    }

    Vim.setOption(":surround:char:", params.selectedCharacter, cm)
    Vim.handleKey(cm, "\0sr", "")
    cm.state.vim.status = "sr"
})

Vim.defineAction("_replaceArround", (cm, params) => {
    let targetChar: string = Vim.getOption(":surround:char:", cm)
    if (!targetChar) {
        return
    }

    let replaceWith = params.selectedCharacter
    if (!replaceWith) {
        return
    }

    Vim.setOption(":surround:char:", "", cm)

    let from = cm.cm6.state.selection.main.from
    let to = cm.cm6.state.selection.main.to
    if (from === to) {
        to++
    }

    let text = cm.cm6.state.doc.toString()

    let firstPos = findBackwards(text, from, targetChar)
    let lastPos = findForwards(text, to, targetChar)

    if (firstPos === -1 || lastPos === -1 || firstPos === lastPos) {
        return
    }

    let tx: TransactionSpec = {
        changes: [
            { from: firstPos - 1, to: firstPos, insert: replaceWith },
            { from: lastPos, to: lastPos + 1, insert: replaceWith },
        ],
    }

    cm.cm6.dispatch(tx)
})

Vim.mapCommand("sr<character>", "action", "replaceArround", [], {})
Vim.mapCommand("\0sr<character>", "action", "_replaceArround", [], { isEdit: true })

Vim.defineAction("deleteArround", (cm, params) => {
    let delChar = params.selectedCharacter
    if (!delChar) {
        return
    }

    let from = cm.cm6.state.selection.main.from
    let to = cm.cm6.state.selection.main.to
    if (from === to) {
        to++
    }

    let text = cm.cm6.state.doc.toString()

    let firstPos = findBackwards(text, from, delChar)
    let lastPos = findForwards(text, to, delChar)

    if (firstPos === -1 || lastPos === -1 || firstPos === lastPos) {
        return
    }

    let tx: TransactionSpec = {
        changes: [
            { from: firstPos - 1, to: firstPos, insert: "" },
            { from: lastPos, to: lastPos + 1, insert: "" },
        ],
    }

    cm.cm6.dispatch(tx)
})

Vim.mapCommand("sd<character>", "action", "deleteArround", [], {
    isEdit: true,
    operatorArgs: { keepCursor: true },
})

export { vim } from "@replit/codemirror-vim"

function indexFromPos(doc: Text, pos: Pos): number {
    let ch = pos.ch
    let lineNumber = pos.line + 1
    if (lineNumber < 1) {
        lineNumber = 1
        ch = 0
    }

    if (lineNumber > doc.lines) {
        lineNumber = doc.lines
        ch = Number.MAX_VALUE
    }
    var line = doc.line(lineNumber)
    return Math.min(line.from + Math.max(0, ch), line.to)
}

function findBackwards(text: string, start: number, needle: string): number {
    if (text.length === 0) {
        return -1
    }

    let needleCodePoint = needle.codePointAt(0)

    let codePoints = [...text.substring(0, start)].reverse()

    let i = 0
    for (let c of codePoints) {
        if (c.codePointAt(0) === needleCodePoint) {
            return start - i
        }

        i += c.length
    }

    return -1
}

function findForwards(text: string, start: number, needle: string): number {
    if (text.length < start) {
        return -1
    }

    let needleCodePoint = needle.codePointAt(0)

    let i = 0
    for (let c of text.substring(start)) {
        if (c.codePointAt(0) === needleCodePoint) {
            return start + i
        }

        i += c.length
    }

    return -1
}
