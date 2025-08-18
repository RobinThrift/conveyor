import React, { useRef } from "react"

import { useOnIntersection } from "@/ui/hooks/useOnIntersection"

export const EndOfListMarker = React.memo(function EndOfListMarker({
    onReached,
}: {
    onReached: () => void
}) {
    let ref = useRef<HTMLDivElement>(null)
    useOnIntersection(
        (isVisible) => {
            if (
                isVisible ||
                (ref.current?.getBoundingClientRect().top ?? 0) <
                    (window.visualViewport?.pageTop ?? 0)
            ) {
                onReached()
            }
        },
        [onReached],
        ref,
    )

    return <div className="invisible " ref={ref} />
})
