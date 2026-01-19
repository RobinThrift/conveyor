import clsx from "clsx"
import React from "react"

export const OverFlowMask = React.memo(function OverFlowMask({
    className,
    dir = "bottom",
}: {
    className?: string
    dir?: "top" | "bottom"
}) {
    return (
        <div className={clsx("overflow-mask", dir, className)}>
            <div className="overflow-mask-item" />
            <div className="overflow-mask-item" />
            <div className="overflow-mask-item" />
            <div className="overflow-mask-item" />
        </div>
    )
})
