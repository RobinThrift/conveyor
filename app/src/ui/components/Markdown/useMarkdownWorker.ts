import type { Root } from "mdast"
import { useEffect, useState } from "react"

import { useNotificationDispatcher } from "@/ui/state/global/notifications"

import { MarkdownParser } from "@/lib/markdown"

let sharedParser: MarkdownParser | undefined
let activeCount = 0

let terminationTimeout: ReturnType<typeof setTimeout> | undefined = undefined

export function useMarkdownWorker(markdown: string) {
    let [result, setResult] = useState<Root | undefined>(undefined)
    let addNotification = useNotificationDispatcher()

    useEffect(() => {
        clearTimeout(terminationTimeout)
        activeCount++

        if (!sharedParser) {
            sharedParser = new MarkdownParser({
                onError: (err) => {
                    let [title, message] = err.message.split(/:\n/, 2)
                    addNotification({
                        type: "error",
                        title: `MarkdownParserWorker: ${title}`,
                        message,
                    })
                },
            })
        }

        sharedParser
            .parse(markdown)
            .then((ast) => {
                if (!ast.ok) {
                    throw ast.err
                }
                setResult(ast.value)
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
                    sharedParser?.terminate()
                    sharedParser = undefined
                }, 5000)
            }
        }
    }, [markdown, addNotification])

    return result
}
