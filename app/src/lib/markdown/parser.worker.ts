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

import type { Context } from "@/lib/context"
import { type AsyncResult, fromThrowing } from "@/lib/result"
import { encodeText } from "@/lib/textencoding"
import { createWorker } from "@/lib/worker"

import { autoTagLinks, mdastAutoTagLinks } from "./extensions/tags"

export const MarkdownParserWorker = createWorker({
    parse: async (
        _: Context,
        { markdown }: { markdown: ArrayBufferLike },
    ): AsyncResult<ArrayBufferLike> => {
        return fromThrowing(() => {
            let ast = fromMarkdown(new Uint8Array(markdown), "utf-8", {
                extensions: [
                    gfmAutolinkLiteral(),
                    gfmFootnote(),
                    gfmStrikethrough(),
                    gfmTable(),
                    directive(),
                    autoTagLinks(),
                ],
                mdastExtensions: [
                    gfmAutolinkLiteralFromMarkdown(),
                    gfmFootnoteFromMarkdown(),
                    gfmStrikethroughFromMarkdown(),
                    gfmTableFromMarkdown(),
                    directiveFromMarkdown(),
                    mdastAutoTagLinks(),
                ],
            })

            return encodeText(JSON.stringify(ast)).buffer
        })
    },
})

MarkdownParserWorker.runIfWorker()
