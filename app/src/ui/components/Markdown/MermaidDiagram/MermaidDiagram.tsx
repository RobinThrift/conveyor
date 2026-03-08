import mermaid from "@robinthrift/minimal-mermaid"
import clsx from "clsx"
import React, { useEffect, useId, useRef, useState } from "react"

import { Alert } from "@/ui/components/Alert"

mermaid.initialize({
    securityLevel: "strict",
    startOnLoad: false,
    suppressErrorRendering: true,
})

export type MermaidDiagramProps = {
    className?: string
    children: string
}

export const MermaidDiagram = React.memo(function MermaidDiagram(props: MermaidDiagramProps) {
    let ref = useRef<HTMLDivElement | null>(null)
    let [error, setError] = useState<Error | undefined>(undefined)
    let [rendered, setRendered] = useState<React.ReactNode | undefined>(undefined)
    let [diagramType, setDiagramType] = useState<string | undefined>(undefined)
    let id = useId()
    let [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        let el = ref?.current
        if (!el) {
            return
        }

        let onContentVisibilityAutoStateChange = (e: Event) => {
            let evt = e as ContentVisibilityAutoStateChangeEvent
            if (!evt.skipped) {
                setIsVisible(true)
                el.removeEventListener(
                    "conrentvisibilityautostatechange",
                    onContentVisibilityAutoStateChange,
                )
            }
        }

        el.addEventListener(
            "contentvisibilityautostatechange",
            onContentVisibilityAutoStateChange,
            { passive: true },
        )

        return () => {
            el.removeEventListener(
                "contentvisibilityautostatechange",
                onContentVisibilityAutoStateChange,
            )
        }
    }, [])

    useEffect(() => {
        if (!isVisible) {
            return
        }

        mermaid
            .render(id, props.children)
            .then(({ diagramType, svg }) => {
                setError(undefined)
                setDiagramType(diagramType)
                setRendered(svg)
            })
            .catch((err) => {
                setError(err)
                setDiagramType(undefined)
                setRendered(undefined)
            })
    }, [id, isVisible, props.children])

    return (
        <div ref={ref} className={clsx("mermaid-diagram-wrapper", props.className)}>
            {error && (
                <>
                    <Alert>{error.message}</Alert>

                    <pre>
                        <code>{props.children}</code>
                    </pre>
                </>
            )}

            {rendered && (
                <div
                    className={clsx("mermaid-diagram", diagramType)}
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: mermaid rendered
                    dangerouslySetInnerHTML={{ __html: rendered }}
                />
            )}
        </div>
    )
})
