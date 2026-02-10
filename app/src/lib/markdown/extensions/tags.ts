import { Tag, tags as t } from "@lezer/highlight"
import type { MarkdownConfig } from "@lezer/markdown"

const TagLinkType = "TagLink"

const isWordChar = /\w+/

export const TagLinkTag = Tag.define("tok-tag-link", t.link)

export const tagLinks: MarkdownConfig = {
    defineNodes: [{ name: "TagLink", style: TagLinkTag }],
    parseInline: [
        {
            name: "TagNote",
            before: "Link",
            parse(cx, next, pos) {
                // looking for # followed by any valid word char (+ slashes)
                if (next === 35 && isWordChar.test(cx.slice(pos + 1, pos + 2))) {
                    let end = cx.end
                    for (let p = pos; p < cx.end; p++) {
                        let c = cx.char(p)
                        if (c === 32 || c === 9 || c === 10) {
                            end = p
                            break
                        }
                    }

                    return cx.addElement(cx.elt(TagLinkType, pos, end))
                }
                return -1
            },
        },
    ],
}
