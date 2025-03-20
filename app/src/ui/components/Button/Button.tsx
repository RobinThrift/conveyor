import clsx from "clsx"
import React from "react"

export interface ButtonProps
    extends React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        HTMLButtonElement
    > {
    className?: string
    children?: React.ReactNode | undefined
    iconLeft?: React.ReactNode
    iconRight?: React.ReactNode
    size?: "sm" | "md" | "lg"
    variant?: "regular" | "primary" | "success" | "danger"
    outline?: boolean
    plain?: boolean
    coverText?: boolean
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
        coverText,
        ariaLabel,
        ...intrinsics
    } = props

    return (
        <button
            {...intrinsics}
            ref={props.ref}
            aria-label={props.ariaLabel}
            className={clsx(
                "btn",
                variant,
                {
                    sm: size === "sm",
                    lg: size === "lg",
                    "icon-only": !children,
                    "outline-btn": outline,
                    "cover-text": coverText,
                    plain: plain,
                },
                className,
            )}
        >
            {iconLeft && iconLeft}
            {children}
            {coverText && iconRight ? (
                <div className="btn-cover-text-icon">{iconRight}</div>
            ) : (
                iconRight && iconRight
            )}
        </button>
    )
}
