import clsx from "clsx"
import React from "react"

export function Loader({ className }: { className?: string }) {
    return (
        <div className={clsx("loader", className)}>
            <div />
        </div>
    )
}
