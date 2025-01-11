import { Button, type ButtonProps } from "@/components//Button"
import { X } from "@phosphor-icons/react"
import * as RadixPopover from "@radix-ui/react-popover"
import clsx from "clsx"
import React from "react"

export interface PopoverProps {
    children: React.ReactNode | React.ReactNode[]
    modal?: boolean
}

export function Popover(props: PopoverProps) {
    return (
        <RadixPopover.Root modal={props.modal}>
            {props.children}
        </RadixPopover.Root>
    )
}

Popover.Trigger = PopoverTrigger
Popover.Content = PopoverContent

export interface PopoverTriggerProps extends ButtonProps {}

export function PopoverTrigger(props: PopoverTriggerProps) {
    return (
        <RadixPopover.Trigger asChild disabled={props.disabled}>
            <Button
                {...props}
                className={clsx("popover-btn", props.className)}
            />
        </RadixPopover.Trigger>
    )
}

export interface PopoverContentProps extends RadixPopover.PopoverContentProps {
    className?: string
    withCloseButton?: boolean
}

export function PopoverContent({
    withCloseButton = true,
    className,
    ...props
}: PopoverContentProps) {
    return (
        <RadixPopover.Portal>
            <RadixPopover.Content
                className={clsx("popover", className)}
                {...props}
            >
                <div className="popover-content">{props.children}</div>

                {withCloseButton && (
                    <RadixPopover.Close
                        className="popover-close"
                        aria-label="Close"
                    >
                        <X />
                    </RadixPopover.Close>
                )}
                <RadixPopover.Arrow className="popover-arrow" />
            </RadixPopover.Content>
        </RadixPopover.Portal>
    )
}
