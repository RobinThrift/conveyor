import { useOnVisible } from "@/hooks/useLoadOnVisible"
import { usePromise } from "@/hooks/usePromise"
import { LanguageDescription } from "@codemirror/language"
import { languages } from "@codemirror/language-data"
import { classHighlighter, highlightCode } from "@lezer/highlight"
import {
    defaultSettingsTokyoNight,
    tokyoNightStyle,
} from "@uiw/codemirror-theme-tokyo-night"
import React, { useMemo, useRef } from "react"

export function Code({
    children,
    lang,
    meta,
}: { children: string; lang?: string; meta?: string }) {
    let ref = useRef(null)
    let isVisible = useOnVisible(ref, { ratio: 0 })

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
                backgroundColor: defaultSettingsTokyoNight.background,
                color: defaultSettingsTokyoNight.foreground,
            }}
        >
            {highlighted}
        </pre>
    )
}

export function Highlight({
    code,
    lang,
}: { code: string; lang?: string; meta?: string }) {
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

    let highlighted = useMemo(() => {
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
        console.error(parser.error)
    }

    return <code>{highlighted}</code>
}

let tagFixes: Record<string, string> = {
    "special(variableName)": "variableName",
    "special(string)": "string",
    "function(variableName)": "variableName",
    "standard(name)": "name",
    "constant(name)": "constant",
    "definition(name)": "definition",
}

let style = tokyoNightStyle
    .map((styles) => {
        let selector = ""
        if (Array.isArray(styles.tag)) {
            selector = styles.tag
                .map((t) => `.tok-${tagFixes[t.toString()] ?? t}`)
                .join(", ")
        } else {
            selector = `.tok-${tagFixes[styles.tag.toString()] ?? styles.tag}`
        }
        return `${selector} {
    color: ${styles.color || "inherit"};
    font-weight: ${styles.fontWeight || "inherit"};
    font-style: ${styles.fontStyle || "inherit"};
    text-decoration: ${styles.fontStyle || "none"};
}`
    })
    .join("\n")

let styleEl = document.querySelector("#syntax-highlighting")
if (styleEl) {
    styleEl.textContent = style
} else {
    styleEl = document.createElement("style")
    styleEl.textContent = style
    document.head.appendChild(styleEl)
}
