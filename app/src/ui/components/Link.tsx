import clsx from "clsx"
import React, { useCallback } from "react"

import type { Screens, Stacks } from "@/control/NavigationController"
import type { ButtonProps } from "@/ui/components/Button"
import { useNavigation } from "@/ui/navigation"

export function Link<S extends keyof Screens>({
    screen,
    params,
    stack,
    ...props
}: React.AnchorHTMLAttributes<any> & {
    ref?: React.Ref<HTMLAnchorElement>
    screen?: S
    params?: Screens[S]
    stack?: Stacks
}) {
    let { push } = useNavigation()
    let onClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (screen) {
                e.preventDefault()
                push(
                    screen,
                    params || {},
                    {
                        scrollOffsetTop: Math.ceil(
                            window.visualViewport?.pageTop ?? window.scrollY,
                        ),
                    },
                    stack,
                )
            }
        },
        [screen, params, stack, push],
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
    params?: Screens[S]
    stack?: Stacks
}

export function LinkButton<S extends keyof Screens>({
    iconRight,
    iconLeft,
    size = "md",
    variant = "regular",
    screen,
    params,
    stack,
    ...props
}: LinkButtonProps<S>) {
    let { push } = useNavigation()
    let onClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (screen) {
                e.preventDefault()
                push(
                    screen,
                    params || {},
                    {
                        scrollOffsetTop: Math.ceil(
                            window.visualViewport?.pageTop ?? window.scrollY,
                        ),
                    },
                    stack,
                )
            }
        },
        [screen, params, push, stack],
    )

    let { outline, plain, children, ...aProps } = props

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: for internal navigation
        <a
            {...aProps}
            // biome-ignore lint/a11y/useValidAnchor: required for internal navigation handling
            onClick={onClick}
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
