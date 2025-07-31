import clsx from "clsx"
import React from "react"
import {
    Button as AriaButton,
    Dialog as AriaDialog,
    DialogTrigger as AriaDialogTrigger,
    Popover as AriaPopover,
} from "react-aria-components"

import { InfoIcon } from "@/ui/components/Icons"

export interface InfoPopoverProps {
    buttonClassName?: string
    popoverClassName?: string

    children: React.ReactNode | React.ReactNode[]
    "aria-label": string

    placement?: "top" | "bottom" | "right" | "left"

    isDisabled?: boolean
}

export function InfoPopover(props: InfoPopoverProps) {
    return (
        <AriaDialogTrigger>
            <AriaButton
                aria-label={props["aria-label"]}
                isDisabled={props.isDisabled}
                className={clsx("info-popover-trigger", props.buttonClassName)}
            >
                <InfoIcon />
            </AriaButton>
            <AriaPopover className="info-popover" placement={props.placement}>
                <AriaDialog className={clsx("info-popover-content", props.popoverClassName)}>
                    {props.children}
                </AriaDialog>
            </AriaPopover>
        </AriaDialogTrigger>
    )
}
