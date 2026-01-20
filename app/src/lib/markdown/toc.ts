import type { Tree } from "@lezer/common"
import { collectText, idFromText } from "./utils"

export type TOCItem = {
    label: string
    id: string
    level: 1 | 2 | 3 | 4 | 5 | 6
    items: TOCItem[]
}

export function buildTOC({
    ast,
    documentID,
    document,
}: {
    ast: Tree
    documentID: string
    document: string
}): TOCItem[] {
    let tocItems: TOCItem[] = []

    let stack: TOCItem[] = []

    let popToParent = (l: number) => {
        for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].level < l) {
                return stack.slice(0, i + 1)
            }
        }

        return stack.slice(0, -1)
    }

    ast.iterate({
        enter: (cursor) => {
            if (cursor.name === "Document") {
                return
            }

            let level: TOCItem["level"] | -1 = -1

            switch (cursor.type.name) {
                case "SetextHeading1":
                case "ATXHeading1":
                    level = 1
                    break
                case "SetextHeading2":
                case "ATXHeading2":
                    level = 2
                    break
                case "ATXHeading3":
                    level = 3
                    break
                case "ATXHeading4":
                    level = 4
                    break
                case "ATXHeading5":
                    level = 5
                    break
                case "ATXHeading6":
                    level = 6
                    break
                default:
                    return false
            }

            let label = collectText(cursor.node, document)
            let id = `${documentID}-${idFromText(label)}`

            let item = { level, label, id, items: [] }

            if (stack.length === 0) {
                stack.push(item)
                tocItems.push(item)
                return false
            }

            let topItem = stack[stack.length - 1]

            if (topItem.level === level) {
                stack.pop()
                if (stack.length === 0) {
                    stack.push(item)
                    tocItems.push(item)
                    return false
                }

                stack[stack.length - 1].items.push(item)
                return false
            } else if (topItem.level < level) {
                topItem.items.push(item)
                stack.push(item)
                return false
            } else if (topItem.level > level) {
                stack = popToParent(level)

                if (stack.length === 0) {
                    stack.push(item)
                    tocItems.push(item)
                    return false
                }

                stack[stack.length - 1].items.push(item)
                stack.push(item)
                return false
            }
        },
    })

    return tocItems
}
