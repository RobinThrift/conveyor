import clsx from "clsx"
import React from "react"

import { CheckIcon, InfoIcon, WarningIcon } from "@/ui/components/Icons"

export interface AlertProps {
    className?: string
    variant: "danger" | "info" | "success"
    children?: React.ReactNode | React.ReactNode[]
}

export function Alert(props: AlertProps) {
    let icon = <InfoIcon />
    switch (props.variant) {
        case "success":
            icon = <CheckIcon />
            break
        case "danger":
            icon = <WarningIcon />
    }

    return (
        <div className={clsx("alert", props.variant, props.className)}>
            {icon}
            <div className="content">{props.children}</div>
        </div>
    )
}
