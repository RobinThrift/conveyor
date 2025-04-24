import { LanguageDescription } from "@codemirror/language"
import { languages } from "@codemirror/language-data"
import { classHighlighter, highlightCode } from "@lezer/highlight"
import React, { useMemo, useRef } from "react"

import { useIdleCallback } from "@/ui/hooks/useIdleCallback"
import { useOnVisible } from "@/ui/hooks/useOnVisible"
import { usePromise } from "@/ui/hooks/usePromise"
import { useNotificationDispatcher } from "@/ui/state/global/notifications"

export function Code({
    className,
    children,
    lang,
    meta,
}: { className?: string; children: string; lang?: string; meta?: string }) {
    let ref = useRef(null)
    let isVisible = useOnVisible(ref, { ratio: 0.1 })

    let highlighted: React.ReactNode | undefined = useMemo(() => {
        if (isVisible) {
            return <Highlight code={children} lang={lang} meta={meta} />
        }

        return <code>{children}</code>
    }, [isVisible, children, lang, meta])

    return (
        <pre
            ref={ref}
            style={{
                backgroundColor: "var(--code-background)",
                color: "var(--code-foreground)",
            }}
            className={className}
        >
            {highlighted}
        </pre>
    )
}

export function Highlight({
    code,
    lang,
}: { code: string; lang?: string; meta?: string }) {
    let addNotification = useNotificationDispatcher()
    let parser = usePromise(async () => {
        if (!lang) {
            return
        }

        let info = LanguageDescription.matchLanguageName(languages, lang, true)
        if (!info) {
            return
        }

        let def = await info.load()

        return def.language.parser
    }, [lang])

    let highlighted = useIdleCallback(() => {
        if (!parser.resolved || !parser.result) {
            return code
        }

        let nodes: React.ReactNode[] = []
        let putText = (code: string, classes: string) => {
            if (code.trim().length !== 0) {
                nodes.push(
                    <span key={nodes.length} className={classes}>
                        {code}
                    </span>,
                )
            } else {
                nodes.push(code)
            }
        }
        let putBreak = () => {
            nodes.push("\n")
        }

        highlightCode(
            code,
            parser.result.parse(code),
            classHighlighter,
            putText,
            putBreak,
        )

        return nodes
    }, [parser, code])

    if (parser.resolved && parser.error) {
        let [title, message] = parser.error.message.split(/:\n/, 2)
        addNotification({
            type: "error",
            title,
            message,
        })
    }

    return <code>{highlighted || code}</code>
}
