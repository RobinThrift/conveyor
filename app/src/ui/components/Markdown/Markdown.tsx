import clsx from "clsx"
import React, { useMemo } from "react"

import { astToJSX, parse } from "@/lib/markdown"
import { Alert } from "@/ui/components/Alert"
import { Figure } from "@/ui/components/Figure"
import { ArrowUDownLeftIcon } from "@/ui/components/Icons"
import { Link } from "@/ui/components/Link"

import { Code } from "./Code"
import { directives } from "./directives"

export interface MarkdownProps {
    ref?: React.Ref<HTMLDivElement>
    children: string
    className?: string
    id: string
    onDoubleClick?: React.MouseEventHandler<HTMLDivElement>
}

export function Markdown(props: MarkdownProps) {
    let parsed = useMemo(() => {
        let ast = parse(props.children)
        if (!ast.ok) {
            return (
                <Alert variant="danger">
                    {ast.err.name}: {ast.err.message}
                    {ast.err.stack && (
                        <pre>
                            <code>{ast.err.stack}</code>
                        </pre>
                    )}
                </Alert>
            )
        }

        return astToJSX(ast.value, props.id, {
            componentMap: {
                Alert,
                Link,
                Code,
                Image: Figure,
                FootnoteReturnIcon: ArrowUDownLeftIcon,
            },
            directives,
        })
    }, [props.children, props.id])

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
