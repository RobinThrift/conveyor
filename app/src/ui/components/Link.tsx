import clsx from "clsx"
import React, { useCallback } from "react"

import type { Params, Screens } from "@/control/NavigationController"
import type { ButtonProps } from "@/ui/components/Button"
import { useNavigation } from "@/ui/navigation"

export function Link<S extends keyof Screens>({
    screen,
    params,
    ...props
}: React.AnchorHTMLAttributes<any> & {
    ref?: React.Ref<HTMLAnchorElement>
    screen?: S
    params?: Params[S]
}) {
    let { push } = useNavigation()
    let onClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (screen) {
                e.preventDefault()
                push(screen, params || {}, {
                    scrollOffsetTop: Math.ceil(window.visualViewport?.pageTop ?? window.scrollY),
                })
            }
        },
        [screen, params, push],
    )

    return (
        // biome-ignore lint/a11y/useValidAnchor: for internal navigation
        // biome-ignore lint/a11y/noStaticElementInteractions: for internal navigation
        <a ref={props.ref} {...props} onClick={screen ? onClick : undefined} />
    )
}

export interface LinkButtonProps<S extends keyof Screens> extends React.AnchorHTMLAttributes<any> {
    iconLeft?: React.ReactNode
    iconRight?: React.ReactNode
    size?: "sm" | "md" | "lg"
    variant?: ButtonProps["variant"]
    outline?: boolean
    plain?: boolean
    href?: string
    screen?: S
    params?: Params[S]
}

export function LinkButton<S extends keyof Screens>({
    iconRight,
    iconLeft,
    size = "md",
    variant = "regular",
    screen,
    params,
    ...props
}: LinkButtonProps<S>) {
    let { push } = useNavigation()
    let onClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (screen) {
                e.preventDefault()
                performance.mark("start-nav")
                push(screen, params || {}, {
                    scrollOffsetTop: Math.ceil(window.visualViewport?.pageTop ?? window.scrollY),
                })
                performance.mark("end-nav")
                performance.measure("start-nav", "end-nav")
            }
        },
        [screen, params, push],
    )

    let { outline, plain, children, ...aProps } = props

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: for internal navigation
        <a
            {...aProps}
            // biome-ignore lint/a11y/useValidAnchor: required for internal navigation handling
            onClick={onClick}
            onMouseEnter={() => performance.mark("hover")}
            className={clsx(
                "btn cursor-pointer",
                variant,
                {
                    sm: size === "sm",
                    lg: size === "lg",
                    "icon-only": !children,
                    "outline-btn": outline,
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
