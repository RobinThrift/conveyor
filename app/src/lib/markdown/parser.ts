import type { Root } from "mdast"

import { BaseContext } from "@/lib/context"
import { type AsyncResult, Ok } from "@/lib/result"

import { decodeText, encodeText } from "@/lib/textencoding"
import { MarkdownParserWorker } from "./parser.worker"

export class MarkdownParser {
    private _worker: ReturnType<typeof MarkdownParserWorker.createClient>

    constructor({ onError }: { onError?: (err: Error) => void } = {}) {
        this._worker = MarkdownParserWorker.createClient(
            new Worker(new URL("./parser.worker?worker&url", import.meta.url), {
                type: "module",
                name: "MarkdownParserWorker",
            }),
        )

        if (onError) {
            this._worker.addEventListener("error", (evt) => {
                onError(evt.data.error)
            })
        }
    }

    public terminate() {
        this._worker.terminate()
    }

    public async parse(markdown: string): AsyncResult<Root> {
        let res = await this._worker.parse(BaseContext, {
            markdown: encodeText(markdown).buffer,
        })
        if (!res.ok) {
            return res
        }

        return Ok(JSON.parse(decodeText(new Uint8Array(res.value))))
    }
}
