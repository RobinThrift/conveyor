import React, { useRef } from "react"

import { useOnIntersection } from "@/ui/hooks/useOnIntersection"

export function EndOfListMarker({ onReached }: { onReached: () => void }) {
    let ref = useRef<HTMLDivElement | null>(null)
    useOnIntersection(
        (isVisible) => {
            if (isVisible) {
                onReached()
            }
        },
        [onReached],
        ref,
    )

    return <div className="invisible " ref={ref} />
}
