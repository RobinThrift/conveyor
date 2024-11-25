import type { Root } from "mdast"
import { useEffect, useState } from "react"
import { MarkdownWorker } from "./parser.worker"

let sharedWorker: MarkdownWorker | undefined
let activeCount = 0

export function useMarkdownWorker(markdown: string) {
    let [result, setResult] = useState<Root | undefined>(undefined)

    useEffect(() => {
        activeCount++

        if (!sharedWorker) {
            sharedWorker = new MarkdownWorker()
        }

        sharedWorker
            .parse(markdown)
            .then((ast) => {
                setResult(ast)
            })
            .catch((err) => {
                // @TODO: proper error handling
                console.error(err)
            })

        return () => {
            activeCount--
            if (activeCount <= 0) {
                activeCount = 0
                sharedWorker?.terminate()
                sharedWorker = undefined
            }
        }
    }, [markdown])

    return result
}
