import { useBaseURL } from "@/hooks/useBaseURL"
import clsx from "clsx"
import React, { useCallback } from "react"
import { $router } from "../App/router"

export function Link({
    external = false,
    ...props
}: React.AnchorHTMLAttributes<any> & { href: string; external?: boolean }) {
    let baseURL = useBaseURL()
    let href = external ? baseURL + props.href : props.href

    let onClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault()
            $router.open(new URL(href, globalThis.location.href).pathname)
        },
        [href],
    )

    return (
        <a {...props} href={href} onClick={!external ? onClick : undefined} />
    )
}

export interface LinkButtonProps extends React.AnchorHTMLAttributes<any> {
    iconLeft?: React.ReactNode
    iconRight?: React.ReactNode
    size?: "sm" | "md" | "lg"
    variant?: "regular" | "primary" | "success" | "danger" | "subtle"
    outline?: boolean
    plain?: boolean
    external?: boolean
    href: string
}

export function LinkButton({
    iconRight,
    iconLeft,
    size = "md",
    variant = "regular",
    external = false,
    ...props
}: LinkButtonProps) {
    let baseURL = useBaseURL()
    let href = external ? baseURL + props.href : props.href

    let onClick = useCallback(() => {
        if (!external) {
            $router.open(new URL(href, globalThis.location.href).pathname)
        }
    }, [href, external])

    let { outline, plain, children, ...aProps } = props

    return (
        <a
            {...aProps}
            href={external ? href : undefined}
            onClick={onClick}
            className={clsx(
                "btn cursor-pointer",
                variant,
                {
                    sm: size === "sm",
                    lg: size === "lg",
                    "icon-only": !children,
                    "outline-btn": props.outline,
                    plain: plain,
                },
                props.className,
            )}
        >
            {iconLeft}
            {props.children}
            {iconRight}
        </a>
    )
}
