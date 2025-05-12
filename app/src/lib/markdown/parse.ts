import type { Root } from "mdast"
import { directiveFromMarkdown } from "mdast-util-directive"
import { fromMarkdown } from "mdast-util-from-markdown"
import { gfmAutolinkLiteralFromMarkdown } from "mdast-util-gfm-autolink-literal"
import { gfmFootnoteFromMarkdown } from "mdast-util-gfm-footnote"
import { gfmStrikethroughFromMarkdown } from "mdast-util-gfm-strikethrough"
import { gfmTableFromMarkdown } from "mdast-util-gfm-table"
import { directive } from "micromark-extension-directive"
import { gfmAutolinkLiteral } from "micromark-extension-gfm-autolink-literal"
import { gfmFootnote } from "micromark-extension-gfm-footnote"
import { gfmStrikethrough } from "micromark-extension-gfm-strikethrough"
import { gfmTable } from "micromark-extension-gfm-table"

import { type Result, fromThrowing } from "@/lib/result"

import { autoTagLinks, mdastAutoTagLinks } from "./extensions/tags"

export function parse(markdown: string): Result<Root> {
    return fromThrowing(() => {
        let ast = fromMarkdown(markdown, "utf-8", {
            extensions: [
                gfmFootnote(),
                gfmStrikethrough(),
                gfmTable(),
                directive(),
                autoTagLinks(),
                gfmAutolinkLiteral(),
            ],
            mdastExtensions: [
                gfmFootnoteFromMarkdown(),
                gfmStrikethroughFromMarkdown(),
                gfmTableFromMarkdown(),
                directiveFromMarkdown(),
                mdastAutoTagLinks(),
                gfmAutolinkLiteralFromMarkdown(),
            ],
        })

        return ast
    })
}
