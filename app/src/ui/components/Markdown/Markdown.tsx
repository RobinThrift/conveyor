import clsx from "clsx"
import React, { useMemo } from "react"

import { astToJSX } from "@/lib/markdown"
import { Alert } from "@/ui/components/Alert"
import { ArrowUDownLeftIcon } from "@/ui/components/Icons"
import { Image } from "@/ui/components/Image"
import { Link } from "@/ui/components/Link"

import { Code } from "./Code"
import { directives } from "./directives"
import { useMarkdownWorker } from "./useMarkdownWorker"

export interface MarkdownProps {
    ref?: React.Ref<HTMLDivElement>
    children: string
    className?: string
    id: string
    onDoubleClick?: React.MouseEventHandler<HTMLDivElement>
}

export function Markdown(props: MarkdownProps) {
    let ast = useMarkdownWorker(props.children)

    let parsed = useMemo(() => {
        if (ast) {
            return astToJSX(ast, props.id, {
                componentMap: {
                    Alert,
                    Link,
                    Code,
                    Image,
                    FootnoteReturnIcon: ArrowUDownLeftIcon,
                },
                directives,
            })
        }
    }, [ast, props.id])

    return (
        <div
            ref={props.ref}
            className={clsx("markdown content", props.className)}
            onDoubleClick={props.onDoubleClick}
        >
            {parsed}
        </div>
    )
}
