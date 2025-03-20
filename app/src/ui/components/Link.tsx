import clsx from "clsx"
import React, { useCallback } from "react"

import { useBaseURL } from "@/ui/hooks/useBaseURL"
import { useGoto } from "@/ui/state/global/router"

export function Link({
    external = false,
    viewTransition,
    ...props
}: React.AnchorHTMLAttributes<any> & {
    ref?: React.Ref<HTMLAnchorElement>
    href: string
    external?: boolean
    viewTransition?: boolean
}) {
    let baseURL = useBaseURL()
    let href = external ? baseURL + props.href : props.href
    let goto = useGoto()

    let onClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault()
            let url = new URL(href, globalThis.location.href)
            let location = url.pathname
            if (url.searchParams.size > 0) {
                location += `?${url.searchParams.toString()}`
            }
            goto(location, undefined, {
                viewTransition,
            })
        },
        [href, goto, viewTransition],
    )

    return (
        <a
            ref={props.ref}
            {...props}
            href={href}
            onClick={!external ? onClick : undefined}
        />
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
    viewTransition?: boolean
}

export function LinkButton({
    iconRight,
    iconLeft,
    size = "md",
    variant = "regular",
    external = false,
    viewTransition,
    ...props
}: LinkButtonProps) {
    let baseURL = useBaseURL()
    let href = external ? baseURL + props.href : props.href
    let goto = useGoto()

    let onClick = useCallback(() => {
        if (!external) {
            goto(new URL(href, globalThis.location.href).pathname, undefined, {
                viewTransition,
            })
        }
    }, [href, external, goto, viewTransition])

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
