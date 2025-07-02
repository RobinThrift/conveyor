import React from "react"
import { LinkPreview } from "../LinkPreview/LinkPreview"

export const directives: Record<string, React.FC<any>> = {
    "link-preview": LinkPreview,

    details: (props: React.PropsWithChildren<{ summary: string; className?: string }>) => {
        return (
            <details className={props.className}>
                <summary>{props.summary}</summary>
                {props.children}
            </details>
        )
    },
}
