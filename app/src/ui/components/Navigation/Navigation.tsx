import clsx from "clsx"
import React from "react"

import { Button } from "@/ui/components/Button"
import { ArrowLeftIcon, GearIcon } from "@/ui/components/Icons"
import { LinkButton } from "@/ui/components/Link"
import { SelectColourScheme, SelectMode } from "@/ui/components/ThemeSwitcher"
import { useT } from "@/ui/i18n"
import { useGoBack } from "@/ui/state/global/router"

export interface NavigationProps {
    className?: string
    active: string
}

export interface NavigationItem {
    label: string
    route: string
    url: string
    icon: React.ReactNode
}

export function Navigation(props: NavigationProps) {
    let t = useT("components/Navigation")
    let goBack = useGoBack()

    return (
        <nav
            className={clsx("navigation", props.className)}
            data-tauri-drag-region
            data-active={props.active}
        >
            {props.active === "settings" ? (
                <Button
                    iconLeft={<ArrowLeftIcon />}
                    plain
                    size="lg"
                    onClick={() =>
                        goBack({ viewTransition: true, fallback: "/" })
                    }
                >
                    <span className="sr-only">{t.Back}</span>
                </Button>
            ) : (
                <LinkButton
                    href="/settings/interface"
                    iconLeft={<GearIcon />}
                    plain
                    size="lg"
                >
                    <span className="sr-only">{t.Settings}</span>
                </LinkButton>
            )}
            <div className="navigation-theme-selector">
                <SelectColourScheme className="w-max" />
                <SelectMode className="w-max" />
            </div>
        </nav>
    )
}
