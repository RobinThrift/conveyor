import React, { useMemo, useRef } from "react"

import { useOnVisible } from "@/ui/hooks/useOnVisible"
import { useHightlighted } from "./useHighlighted"

export const Code = React.memo(function Code({
    className,
    children,
    lang,
    hightlightedLines: hightlightLines,
    meta,
}: {
    className?: string
    children: string
    lang?: string
    hightlightedLines?: number[]
    meta?: string
}) {
    let ref = useRef(null)
    let isVisible = useOnVisible(ref, { ratio: 0.1 })

    let highlighted: React.ReactNode | undefined = useMemo(() => {
        if (isVisible) {
            return (
                <Highlight
                    code={children}
                    lang={lang}
                    hightlightedLines={hightlightLines}
                    meta={meta}
                />
            )
        }

        return <code>{children}</code>
    }, [isVisible, children, lang, hightlightLines, meta])

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
})

const Highlight = React.memo(function Highlight({
    code,
    lang,
    hightlightedLines,
}: { code: string; lang?: string; hightlightedLines?: number[]; meta?: string }) {
    let highlighted = useHightlighted({ code, lang, hightlightedLines })
    return <code>{highlighted || code}</code>
})
