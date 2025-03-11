import clsx from "clsx"
import React from "react"

export function Loader({ className }: { className?: string }) {
    return (
        <div
            className={clsx("loader", className)}
            role="progressbar"
            aria-label="Loading"
            aria-valuetext="Loading..."
            aria-valuemin={0}
            aria-valuenow={0}
            aria-valuemax={100}
            tabIndex={-1}
        />
    )
}
