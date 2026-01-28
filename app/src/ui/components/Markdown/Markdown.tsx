import React, { useMemo } from "react"

import { astToJSX, type ComponentMap, parse } from "@/lib/markdown"
import { Alert } from "@/ui/components/Alert"
import { ArrowUDownLeftIcon } from "@/ui/components/Icons"
import { ZoomableImage } from "@/ui/components/Image"
import { Link } from "@/ui/components/Link"

import { Code } from "./Code"
import { customBlocks } from "./customBlocks"
import { TagLink } from "./TagLink"

export interface MarkdownProps {
    ref?: React.Ref<HTMLDivElement>
    children: string
    className?: string
    id: string
    onDoubleClick?: React.MouseEventHandler<HTMLDivElement>
    componentMap?: Pick<ComponentMap, "Heading">
}

export function Markdown(props: MarkdownProps) {
    let parsed = useMemo(() => {
        let [ast, err] = parse(props.children)
        if (err) {
            return (
                <Alert>
                    {err.name}: {err.message}
                    {err.stack && (
                        <pre>
                            <code>{err.stack}</code>
                        </pre>
                    )}
                </Alert>
            )
        }

        return astToJSX(ast, props.id, props.children, {
            componentMap: {
                Alert,
                Link,
                Code,
                Image: ZoomableImage,
                FootnoteReturnIcon: ArrowUDownLeftIcon,
                TagLink,
                ...(props.componentMap ?? {}),
            },
            customBlocks,
        })
    }, [props.children, props.id, props.componentMap])

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: this is intentional
        <div ref={props.ref} className={props.className} onDoubleClick={props.onDoubleClick}>
            {parsed}
        </div>
    )
}
