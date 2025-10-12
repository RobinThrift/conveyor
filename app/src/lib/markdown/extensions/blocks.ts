import { Tag } from "@lezer/highlight"
import type { Element, MarkdownConfig } from "@lezer/markdown"

const CustomBlockType = "CustomBlock"

const CustomBlockStartDelimiter = "CustomBlockStart"
const CustomBlockEndDelimiter = "CustomBlockEnd"

const CustomBlockName = "CustomBlockName"

const CustomBlockArgs = "CustomBlockArgs"

const CustomBlockTag = Tag.define("CustomBlock")

export const customBlocks: MarkdownConfig = {
    defineNodes: [
        { name: CustomBlockStartDelimiter, style: CustomBlockTag },
        { name: CustomBlockEndDelimiter, style: CustomBlockTag },
        { name: CustomBlockName },
        { name: CustomBlockArgs },
        {
            name: CustomBlockType,
            block: true,
            composite: (_, line) => {
                return !isEndOfBlock(line.text)
            },
        },
    ],
    parseBlock: [
        {
            name: "CustomBlockStart",
            after: "SetextHeading",
            endLeaf: (_, line) => isStartOfBlock(line.text),
            parse: (cx, line) => {
                if (!isStartOfBlock(line.text)) {
                    return false
                }

                cx.startComposite(CustomBlockType, line.pos)

                cx.addElement(cx.elt(CustomBlockStartDelimiter, cx.lineStart, cx.lineStart + 3))

                let nameStart = cx.lineStart + 4
                let nameEnd = cx.lineStart + line.text.length

                let argsStart = line.text.indexOf(" | ")
                let argsEl: Element | null = null
                if (argsStart !== -1) {
                    argsEl = cx.elt(
                        CustomBlockArgs,
                        cx.lineStart + argsStart + 3,
                        cx.lineStart + line.text.length,
                    )

                    nameEnd = cx.lineStart + argsStart
                }

                cx.addElement(cx.elt(CustomBlockName, nameStart, nameEnd))
                if (argsEl) {
                    cx.addElement(argsEl)
                }

                return cx.nextLine()
            },
        },
        {
            name: "CustomBlockEnd",
            after: "SetextHeading",
            parse: (cx, line) => {
                if (!isEndOfBlock(line.text)) {
                    return false
                }

                cx.addElement(cx.elt(CustomBlockEndDelimiter, cx.lineStart, cx.lineStart + 3))

                return cx.nextLine()
            },

            endLeaf: (_, line) => isEndOfBlock(line.text),
        },
    ],
}

// looking for /// [a-z] at the beggining of the line
function isStartOfBlock(line: string) {
    return (
        line.charCodeAt(0) === 47 &&
        line.charCodeAt(1) === 47 &&
        line.charCodeAt(2) === 47 &&
        line.charCodeAt(3) === 32
    )
}

// looking for /// at the end of the line
function isEndOfBlock(line: string) {
    let text = line.trim()
    return (
        text.length === 3 &&
        text.charCodeAt(0) === 47 &&
        text.charCodeAt(1) === 47 &&
        text.charCodeAt(2) === 47
    )
}
