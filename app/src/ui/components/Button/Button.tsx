import clsx from "clsx"
import React from "react"
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components"

export type { PressEvent } from "react-aria"

export interface ButtonProps extends AriaButtonProps {
    className?: string
    children?: React.ReactNode | undefined
    iconLeft?: React.ReactNode
    iconRight?: React.ReactNode
    size?: "sm" | "md" | "lg"
    variant?: "regular" | "primary" | "success" | "danger"
    outline?: boolean
    plain?: boolean
    ariaLabel?: string
    ref?: React.Ref<HTMLButtonElement>
}

export function Button(props: ButtonProps) {
    let {
        className,
        children,
        iconLeft,
        iconRight,
        size = "md",
        variant,
        outline,
        plain,
        ariaLabel,
        ...intrinsics
    } = props

    return (
        <AriaButton
            {...intrinsics}
            ref={props.ref}
            aria-label={ariaLabel}
            className={clsx(
                "btn",
                variant,
                {
                    sm: size === "sm",
                    lg: size === "lg",
                    "icon-only": !children,
                    "outline-btn": outline,
                    plain: plain,
                },
                className,
            )}
        >
            {iconLeft ? <span className="icon">{iconLeft}</span> : null}
            {children}
            {iconRight ? <span className="icon">{iconRight}</span> : null}
        </AriaButton>
    )
}
