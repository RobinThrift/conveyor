import { LanguageDescription } from "@codemirror/language"
import { languages } from "@codemirror/language-data"
import type { Parser } from "@lezer/common"
import { classHighlighter, highlightCode } from "@lezer/highlight"
import React, { startTransition, useEffect, useState } from "react"

import { useNotificationDispatcher } from "@/ui/state/global/notifications"

const _parserInProgress = new Map<string, Promise<Parser>>()
const _parsers = new Map<string, Parser>()

export function useHightlighted({
    code,
    lang,
}: {
    code: string
    lang?: string
}): string | React.ReactNode[] {
    let addNotification = useNotificationDispatcher()
    let [parser, setParser] = useState<
        { lang: string; parser: Parser } | undefined
    >(() => {
        if (!lang) {
            return undefined
        }
        let parser = _parsers.get(lang)
        if (!parser) {
            return undefined
        }

        return { lang, parser }
    })
    let [highlighted, setHighlighted] = useState<string | React.ReactNode[]>(
        () => {
            if (!lang) {
                return code
            }

            let parser = _parsers.get(lang)
            if (!parser) {
                return code
            }

            return hightlight({ code, parser })
        },
    )

    if (lang && parser && parser?.lang !== lang) {
        setParser(undefined)
    }

    useEffect(() => {
        if (!lang) {
            return
        }

        if (parser) {
            startTransition(() => {
                setHighlighted(hightlight({ code, parser: parser.parser }))
            })
            return
        }

        let interrupted = false
        ;(async () => {
            let parser = _parserInProgress.get(lang)
            if (parser) {
                return await parser
            }

            let info = LanguageDescription.matchLanguageName(
                languages,
                lang,
                true,
            )
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
                    setHighlighted(hightlight({ code, parser }))
                })
            })
            .catch((error) => {
                let [title, message] = error.message.split(/:\n/, 2)
                addNotification({
                    type: "error",
                    title,
                    message,
                })
            })

        return () => {
            interrupted = true
        }
    }, [parser, code, lang, addNotification])

    return highlighted
}

function hightlight({ code, parser }: { code: string; parser: Parser }) {
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

    highlightCode(code, parser.parse(code), classHighlighter, putText, putBreak)

    return nodes
}
