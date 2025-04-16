import clsx from "clsx"
import React from "react"

import { Button } from "@/ui/components/Button"
import { ArrowLeftIcon, SlidersIcon } from "@/ui/components/Icons"
import { LinkButton } from "@/ui/components/Link"
import { useT } from "@/ui/i18n"
import { useNavigation } from "@/ui/navigation"

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
    let nav = useNavigation()

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
                    onPress={() => nav.pop()}
                >
                    <span className="sr-only">{t.Back}</span>
                </Button>
            ) : (
                <LinkButton
                    screen="settings"
                    iconLeft={<SlidersIcon />}
                    plain
                    size="lg"
                >
                    <span className="sr-only">{t.Settings}</span>
                </LinkButton>
            )}
        </nav>
    )
}
