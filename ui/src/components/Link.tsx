import { useBaseURL } from "@/hooks/useBaseURL"
import { useGoto } from "@/state/router"
import clsx from "clsx"
import React, { useCallback } from "react"

export const Link = React.forwardRef<
    HTMLAnchorElement,
    React.AnchorHTMLAttributes<any> & {
        href: string
        external?: boolean
        viewTransition?: boolean
    }
>(function Link({ external = false, viewTransition, ...props }, forwardedRef) {
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
            goto(location, {
                viewTransition,
            })
        },
        [href, goto, viewTransition],
    )

    return (
        <a
            ref={forwardedRef}
            {...props}
            href={href}
            onClick={!external ? onClick : undefined}
        />
    )
})

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
            goto(new URL(href, globalThis.location.href).pathname, {
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
