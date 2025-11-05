import clsx from "clsx"
import React, { useCallback, useId } from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    ref?: React.Ref<HTMLButtonElement>
    iconLeft?: React.ReactNode
    iconRight?: React.ReactNode
    variant?: "regular" | "primary" | "danger"
    tooltip?: React.ReactElement | React.ReactElement[] | string
    preventFocusOnPress?: boolean
}

export function Button(props: ButtonProps) {
    let {
        className,
        children,
        iconLeft,
        iconRight,
        variant,
        ref,
        preventFocusOnPress,
        ...intrinsics
    } = props

    let tooltipID = useId()

    intrinsics.onMouseOver = useCallback(
        (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            props.onMouseOver?.(e)
            let target = e.target as HTMLElement
            if (target.tagName !== "BUTTON") {
                target = target.closest("button") as HTMLElement
            }
            // @ts-expect-error: in newer api version
            document.getElementById(tooltipID)?.showPopover({ source: target })
        },
        [tooltipID, props.onMouseOver],
    )

    intrinsics.onMouseLeave = useCallback(
        (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            props.onMouseLeave?.(e)
            document.getElementById(tooltipID)?.hidePopover()
        },
        [tooltipID, props.onMouseLeave],
    )

    intrinsics.onFocus = useCallback(
        (e: React.FocusEvent<HTMLButtonElement, Element>) => {
            props.onFocus?.(e)
            let target = e.target as HTMLElement
            if (target.tagName !== "BUTTON") {
                target = target.closest("button") as HTMLElement
            }
            // @ts-expect-error: in newer api version
            document.getElementById(tooltipID)?.showPopover({ source: target })
        },
        [tooltipID, props.onFocus],
    )

    intrinsics.onBlur = useCallback(
        (e: React.FocusEvent<HTMLButtonElement, Element>) => {
            props.onBlur?.(e)
            document.getElementById(tooltipID)?.hidePopover()
        },
        [tooltipID, props.onBlur],
    )

    intrinsics.onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLButtonElement>) => {
            props.onPointerDown?.(e)

            if (preventFocusOnPress) {
                props.onClick?.(e)
                e.preventDefault()
            }
        },
        [props.onPointerDown, props.onClick, preventFocusOnPress],
    )

    intrinsics.onClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            if (preventFocusOnPress) {
                e.preventDefault()
            } else {
                props.onClick?.(e)
            }
        },
        [props.onClick, preventFocusOnPress],
    )

    return (
        <>
            <button
                {...intrinsics}
                ref={ref}
                className={clsx(
                    "btn",
                    variant,
                    {
                        "icon-only": !children,
                    },
                    className,
                )}
            >
                {iconLeft ? (
                    <span className="icon" aria-hidden="true">
                        {iconLeft}
                    </span>
                ) : null}
                {children}
                {iconRight ? (
                    <span className="icon" aria-hidden="true">
                        {iconRight}
                    </span>
                ) : null}
            </button>
            {props.tooltip && (
                <div id={tooltipID} className="tooltip" popover="hint">
                    {props.tooltip}
                </div>
            )}
        </>
    )
}
