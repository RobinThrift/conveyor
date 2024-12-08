import { randomID } from "@/helper"
import { add as addNotification } from "@/notifications/store"
import type { Root } from "mdast"
import type {
    WorkerInput,
    WorkerOutput,
    WorkerOutputError,
    WorkerOutputResult,
} from "./parser.worker.internal"

export class MarkdownWorker {
    private _worker: Worker
    private _requests = new Map<
        string,
        { resolve: (ast: Root) => void; reject: (err: Error) => void }
    >()
    private _encoder = new TextEncoder()
    private _decoder = new TextDecoder()

    constructor() {
        this._worker = new Worker(
            new URL("./parser.worker.internal.ts?worker&url", import.meta.url),
            {
                type: "module",
                name: "MarkdownWorker",
            },
        )

        this._worker.onmessageerror = (evt) => {
            let [title, message] = evt.data.error.message.split(/:\n/, 2)
            addNotification({
                type: "error",
                title,
                message,
            })
        }
        this._worker.onmessage = (evt: MessageEvent<WorkerOutput>) => {
            switch (evt.data.type) {
                case "result":
                    this._handleResult(evt.data)
                    break
                case "error":
                    this._handleError(evt.data)
                    break
                default:
                    throw new Error(
                        `unknown output type ${JSON.stringify(evt.data)}`,
                    )
            }
        }
    }

    private _handleResult(output: WorkerOutputResult) {
        let request = this._requests.get(output.id)
        if (!request) {
            return
        }

        request.resolve(JSON.parse(this._decoder.decode(output.data)))
        this._requests.delete(output.id)
    }

    private _handleError(output: WorkerOutputError) {
        let request = this._requests.get(output.id)
        if (!request) {
            return
        }

        request.reject(output.error)
        this._requests.delete(output.id)
    }

    public terminate() {
        this._worker.terminate()
    }

    public parse(markdown: string): Promise<Root> {
        let id = randomID()

        let result = new Promise<Root>((resolve, reject) => {
            this._requests.set(id, { resolve, reject })
        })

        this._worker.postMessage({
            type: "parse",
            id,
            params: {
                markdown: this._encoder.encode(markdown),
            },
        } satisfies WorkerInput)

        return result
    }
}
