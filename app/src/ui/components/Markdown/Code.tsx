import React, { useMemo, useRef } from "react"

import { useOnVisible } from "@/ui/hooks/useOnVisible"
import { useHightlighted } from "./useHighlighted"

export const Code = React.memo(function Code({
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
})

const Highlight = React.memo(function Highlight({
    code,
    lang,
}: { code: string; lang?: string; meta?: string }) {
    let highlighted = useHightlighted({ code, lang })
    return <code>{highlighted || code}</code>
})
