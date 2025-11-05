import clsx from "clsx"
import React from "react"

export type ButtonGroupProps = React.HTMLAttributes<HTMLDivElement>

export function ButtonGroup({ className, ...props }: ButtonGroupProps) {
    return <div className={clsx("btn-grp", className)} {...props} />
}
