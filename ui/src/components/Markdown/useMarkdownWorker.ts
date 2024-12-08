import { add as addNotification } from "@/notifications/store"
import type { Root } from "mdast"
import { useEffect, useState } from "react"
import { MarkdownWorker } from "./parser.worker"

let sharedWorker: MarkdownWorker | undefined
let activeCount = 0

let terminationTimeout: ReturnType<typeof setTimeout> | undefined = undefined

export function useMarkdownWorker(markdown: string) {
    let [result, setResult] = useState<Root | undefined>(undefined)

    useEffect(() => {
        clearTimeout(terminationTimeout)
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
                let [title, message] = err.message.split(/:\n/, 2)
                addNotification({
                    type: "error",
                    title,
                    message,
                })
            })

        return () => {
            activeCount--
            if (activeCount <= 0) {
                terminationTimeout = setTimeout(() => {
                    activeCount = 0
                    sharedWorker?.terminate()
                    sharedWorker = undefined
                }, 5000)
            }
        }
    }, [markdown])

    return result
}
