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
import { autoTagLinks, mdastAutoTagLinks } from "./tagExtension"

export type WorkerInput = ParseInput

export interface ParseInput {
    type: "parse"
    id: string
    params: {
        markdown: Uint8Array | ArrayBuffer
    }
}

export type WorkerOutput = WorkerOutputResult | WorkerOutputError

export interface WorkerOutputError {
    type: "error"
    id: string
    error: Error
}

export interface WorkerOutputResult {
    type: "result"
    id: string
    data: Uint8Array | ArrayBuffer
}

globalThis.onmessage = (evt: MessageEvent<WorkerInput>) => {
    try {
        switch (evt.data.type) {
            case "parse":
                parseMarkdown(evt.data.params.markdown, evt.data.id)
                break
            default:
                throw new Error(`unknown input type ${evt.data.type}`)
        }
    } catch (err) {
        postMessage({
            type: "error",
            error: err as Error,
            id: evt.data.id,
        } satisfies WorkerOutputError)
    }
}

const encoder = new TextEncoder()

function parseMarkdown(content: Uint8Array | ArrayBuffer, id: string) {
    let ast = fromMarkdown(new Uint8Array(content), "utf-8", {
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

    postMessage({
        type: "result",
        id,
        data: encoder.encode(JSON.stringify(ast)),
    } satisfies WorkerOutputResult)
}
