import * as RadixTooltip from "@radix-ui/react-tooltip"
import clsx from "clsx"
import React from "react"

export interface TooltipProps {
    className?: string

    children: React.ReactNode | React.ReactNode[]
    content: React.ReactNode | React.ReactNode[]

    placement?: "top" | "bottom"

    disabled?: boolean
    open?: boolean
}

export function Tooltip(props: TooltipProps) {
    return (
        <RadixTooltip.Provider>
            <RadixTooltip.Root open={props.open}>
                <RadixTooltip.Trigger asChild>
                    {props.children}
                </RadixTooltip.Trigger>
                <RadixTooltip.Portal>
                    <RadixTooltip.Content
                        className={clsx("tooltip", props.className)}
                        side={props.placement ?? "bottom"}
                    >
                        {props.content}
                        <RadixTooltip.Arrow className="fill-subtle-light drop-shadow-lg" />
                    </RadixTooltip.Content>
                </RadixTooltip.Portal>
            </RadixTooltip.Root>
        </RadixTooltip.Provider>
    )
}
