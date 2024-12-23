import { Link } from "@/components/Link"
import { useT } from "@/i18n"
import { Archive, GearFine, Notepad, TrashSimple } from "@phosphor-icons/react"
import clsx from "clsx"
import React, { useMemo } from "react"

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
    const items: NavigationItem[] = useMemo(
        () => [
            {
                label: t.Memos,
                route: "memos.list",
                url: "/memos",
                icon: <Notepad weight="fill" />,
            },
            {
                label: t.Archive,
                route: "memos.archive",
                url: "/memos/archive",
                icon: <Archive weight="fill" />,
            },
            {
                label: t.Bin,
                route: "memos.bin",
                url: "/memos/bin",
                icon: <TrashSimple weight="fill" />,
            },
            {
                label: t.Settings,
                route: "settings",
                url: "/settings/interface",
                icon: <GearFine weight="fill" />,
            },
        ],
        [t.Memos, t.Archive, t.Bin, t.Settings],
    )

    return (
        <nav className={clsx("navigation", props.className)}>
            <ul className="navigation-items">
                {items.map((item) => (
                    <li
                        key={item.url}
                        className={clsx("navigation-item", {
                            active: item.route === props.active,
                        })}
                    >
                        <Link href={item.url} aria-label={item.label}>
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
