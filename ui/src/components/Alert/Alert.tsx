import { Check, Info, Warning } from "@phosphor-icons/react"
import clsx from "clsx"
import React from "react"

export interface AlertProps {
    className?: string
    variant: "danger" | "info" | "success"
    children: React.ReactNode | React.ReactNode[]
}

export function Alert(props: AlertProps) {
    let icon = <Info />
    switch (props.variant) {
        case "success":
            icon = <Check />
            break
        case "danger":
            icon = <Warning />
    }

    return (
        <div className={clsx("alert", props.variant)}>
            {icon}
            <div className="content">{props.children}</div>
        </div>
    )
}
