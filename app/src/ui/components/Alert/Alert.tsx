import clsx from "clsx"
import React from "react"

import { WarningIcon } from "@/ui/components/Icons"

export interface AlertProps {
    className?: string
    children?: React.ReactNode | React.ReactNode[]
}

export function Alert(props: AlertProps) {
    return (
        <div className={clsx("alert", props.className)}>
            <WarningIcon />
            <div className="content">{props.children}</div>
        </div>
    )
}
