import { Tag, tags as t } from "@lezer/highlight"
import type { DelimiterType, MarkdownConfig } from "@lezer/markdown"

const FootnoteDefType = "FootnoteDef"

const FootnoteRefDelimter: DelimiterType = { resolve: "FootnoteRef", mark: "FootnoteMark" }

const FootnoteTag = Tag.define("Footnote")

export const footnotes: MarkdownConfig = {
    defineNodes: [
        { name: "FootnoteDef", style: FootnoteTag },
        { name: "FootnoteRef", style: t.link },
        { name: "FootnoteMark", style: t.link },
    ],
    parseBlock: [
        {
            name: "FootnoteDef",
            parse(cx, line) {
                // looking for [^
                if (line.text.charCodeAt(0) !== 91 && line.text.charCodeAt(1) !== 94) {
                    return false
                }

                let refEndPosRelative = line.text.indexOf("]:")
                if (refEndPosRelative === -1) {
                    return false
                }

                let refEndPos = line.skipSpace(cx.lineStart + refEndPosRelative + 2)

                cx.addElement(
                    cx.elt(FootnoteDefType, cx.lineStart, cx.lineStart + line.text.length, [
                        // biome-ignore lint/style/noNonNullAssertion: is non null, as defined above
                        cx.elt(FootnoteRefDelimter.mark!, cx.lineStart, cx.lineStart + 1),
                        // biome-ignore lint/style/noNonNullAssertion: is non null, as defined above
                        cx.elt(FootnoteRefDelimter.mark!, refEndPos - 2, refEndPos),
                        ...cx.parser.parseInline(
                            line.text.substring(refEndPosRelative + 2),
                            refEndPos,
                        ),
                    ]),
                )

                return cx.nextLine()
            },
        },
    ],
    parseInline: [
        {
            name: "FootnoteRef",
            before: "Link",
            parse(cx, next, pos) {
                // looking for [^
                if (next === 91 && cx.char(pos + 1) === 94) {
                    return cx.addDelimiter(FootnoteRefDelimter, pos, pos + 2, true, false)
                }
                return -1
            },
        },

        {
            name: "FootnoteRefEnd",
            parse(cx, next, pos) {
                // looking for ]
                if (next !== 93) {
                    return -1
                }

                let start = cx.findOpeningDelimiter(FootnoteRefDelimter)
                if (start === null) {
                    return -1
                }

                return cx.addDelimiter(FootnoteRefDelimter, pos, pos + 1, false, true)
            },
        },
    ],
}
