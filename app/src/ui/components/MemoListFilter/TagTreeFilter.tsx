import clsx from "clsx"
import React from "react"

import { TagTree } from "./TagTree"

export function TagTreeFilter(props: { className?: string }) {
    return (
        <div className={clsx("memo-list-tag-filter", props.className)}>
            <TagTree />
        </div>
    )
}
