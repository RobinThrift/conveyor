import React, { useCallback } from "react"

import { actions } from "@/ui/stores"

export function TagLink({ tag, className }: { tag: string; className?: string }) {
    let onClick = useCallback(() => {
        actions.memos.list.setFilter({ tag })
    }, [tag])

    return (
        <button className={className} type="button" onClick={onClick}>
            #{tag}
        </button>
    )
}
