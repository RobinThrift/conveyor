import { LanguageDescription } from "@codemirror/language"
import { languages } from "@codemirror/language-data"
import type { Parser } from "@lezer/common"
import { classHighlighter, highlightCode } from "@lezer/highlight"
import React, { startTransition, useEffect, useState } from "react"

const _parserInProgress = new Map<string, Promise<Parser>>()
const _parsers = new Map<string, Parser>()

export function useHightlighted({
    code,
    lang,
    hightlightedLines,
}: {
    code: string
    lang?: string
    hightlightedLines?: number[]
}): string | React.ReactNode[] {
    let [parser, setParser] = useState<{ lang: string; parser: Parser } | undefined>(() => {
        if (!lang) {
            return undefined
        }
        let parser = _parsers.get(lang)
        if (!parser) {
            return undefined
        }

        return { lang, parser }
    })
    let [highlighted, setHighlighted] = useState<string | React.ReactNode[]>(() => {
        if (!lang) {
            return code
        }

        let parser = _parsers.get(lang)
        if (!parser) {
            return code
        }

        return hightlight({ code, parser, hightlightedLines })
    })

    if (lang && parser && parser?.lang !== lang) {
        setParser(undefined)
    }

    useEffect(() => {
        if (!lang) {
            return
        }

        if (parser) {
            startTransition(() => {
                setHighlighted(hightlight({ code, parser: parser.parser, hightlightedLines }))
            })
            return
        }

        let interrupted = false
        ;(async () => {
            let parser = _parserInProgress.get(lang)
            if (parser) {
                return await parser
            }

            let info = LanguageDescription.matchLanguageName(languages, lang, true)
            if (!info) {
                return
            }

            let loaded = (async () => {
                let { language } = await info.load()
                return language.parser
            })()

            _parserInProgress.set(lang, loaded)

            return await loaded
        })()
            .then((parser) => {
                if (parser) {
                    _parsers.set(lang, parser)
                }

                if (interrupted) {
                    return
                }

                startTransition(() => {
                    if (!parser) {
                        return
                    }
                    setParser({ parser, lang })
                    setHighlighted(hightlight({ code, parser, hightlightedLines }))
                })
            })
            .catch((error) => {
                let [title, message] = error.message.split(/:\n/, 2)
                console.error({
                    type: "error",
                    title,
                    message,
                })
            })

        return () => {
            interrupted = true
        }
    }, [parser, code, lang, hightlightedLines])

    return highlighted
}

function hightlight({
    code,
    parser,
    hightlightedLines,
}: { code: string; parser: Parser; hightlightedLines?: number[] }) {
    let line = 0
    let nodes: React.ReactNode[][] = [[]]

    let putText = (code: string, classes: string) => {
        if (code.trim().length !== 0) {
            nodes[line].push(
                <span key={nodes[line].length} className={classes}>
                    {code}
                </span>,
            )
        } else {
            nodes[line].push(code)
        }
    }

    let putBreak = () => {
        if (hightlightedLines?.includes(line)) {
            nodes[line] = [
                <span key={1} className="code-line-highlight">
                    {nodes[line]}
                </span>,
            ]
        } else {
            nodes[line].push("\n")
        }

        line++
        nodes[line] = []
    }

    highlightCode(code, parser.parse(code), classHighlighter, putText, putBreak)

    return nodes
}
