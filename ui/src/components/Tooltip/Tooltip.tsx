import { Tooltip as BaseUITooltip } from "@base-ui-components/react/tooltip"
import clsx from "clsx"
import React from "react"

export interface TooltipProps {
    className?: string

    children: React.ReactNode | React.ReactNode[]
    content: React.ReactNode | React.ReactNode[]

    placement?: "top" | "bottom" | "right" | "left"
    sideOffset?: number

    disabled?: boolean
    open?: boolean
}

export function Tooltip(props: TooltipProps) {
    let sideOffset = props.sideOffset ?? 10
    return (
        <BaseUITooltip.Provider>
            <BaseUITooltip.Root open={props.open}>
                <BaseUITooltip.Trigger
                    render={(triggerProps: any) =>
                        React.Children.map(props.children, (c) =>
                            React.cloneElement(c as any, triggerProps),
                        ) as any
                    }
                />
                <BaseUITooltip.Portal>
                    <BaseUITooltip.Positioner
                        side={props.placement ?? "bottom"}
                        sideOffset={sideOffset}
                    >
                        <BaseUITooltip.Popup
                            className={clsx("tooltip", props.className)}
                        >
                            {props.content}
                            <BaseUITooltip.Arrow className="tooltip-arrow">
                                <Arrow />
                            </BaseUITooltip.Arrow>
                        </BaseUITooltip.Popup>
                    </BaseUITooltip.Positioner>
                </BaseUITooltip.Portal>
            </BaseUITooltip.Root>
        </BaseUITooltip.Provider>
    )
}

function Arrow(props: React.ComponentProps<"svg">) {
    return (
        // biome-ignore lint/a11y/noSvgWithoutTitle: is just decoration
        <svg width="20" height="10" viewBox="0 0 20 10" {...props}>
            <path d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z" />
            <path d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z" />
            <path
                d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
                className="stroke-subtle-light"
            />
        </svg>
    )
}
