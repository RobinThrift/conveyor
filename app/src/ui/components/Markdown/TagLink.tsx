import React, { useCallback } from "react"

import { actions } from "@/ui/stores"

export function TagLink({
    tag,
    className,
    pos,
}: {
    tag: string
    className?: string
    pos?: number
}) {
    let onClick = useCallback(() => {
        actions.memos.list.setFilter({ tag })
    }, [tag])

    return (
        <button className={className} type="button" onClick={onClick} data-pos={pos}>
            #{tag}
        </button>
    )
}
