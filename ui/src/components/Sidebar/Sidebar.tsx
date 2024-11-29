import { Link } from "@/components/Link"
import { useBreakpoint } from "@/hooks/useBreakPoint"
import { useT } from "@/i18n"
import { List, SignOut } from "@phosphor-icons/react"
import clsx from "clsx"
import React, { useMemo } from "react"
import { Sheet, SheetContent, SheetTrigger } from "../Sheet"
import { ModeSwitcher, ThemeSwitcher } from "../ThemeSwitcher"

export interface SidebarProps {
    className?: string
    items: SidebarItem[]
    username: string
}

export interface SidebarItem {
    label: string
    url: string
    isActive: boolean
    icon: React.ReactNode
}

export function Sidebar(props: SidebarProps) {
    let useCollapsibleSidebar = useBreakpoint(1630)
    let t = useT("components/Sidebar")
    let greeting = useMemo(() => {
        let now = new Date()
        if (now.getHours() < 12) {
            return t.GreetingMorning
        }

        if (now.getHours() < 18) {
            return t.GreetingAfternoon
        }

        return t.GreetingEvening
    }, [t.GreetingMorning, t.GreetingEvening, t.GreetingAfternoon])

    let content = (
        <div className="h-full flex flex-col bg-sidebar">
            <div className="px-6 py-4 mb-4 overflow-hidden">
                <span className="block -mb-2 font-semibold">{greeting}</span>
                <span className="text-primary text-2xl font-bold">
                    {props.username}
                </span>
            </div>

            <nav className="flex w-full grow">
                <ul className="w-full h-fit p-4 pt-0 space-y-1">
                    {props.items.map((item) => (
                        <li key={item.url}>
                            <Link
                                href={item.url}
                                className={clsx(
                                    "flex items-center gap-4 cursor-pointer w-full rounded p-2 hover:text-primary font-semibold transition hover:bg-body",
                                    {
                                        "bg-body text-primary border-l-2 border-l-primary":
                                            item.isActive,
                                    },
                                )}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="px-4 py-4 w-full flex flex-col gap-y-4">
                <div className="space-y-2">
                    <ThemeSwitcher />
                    <ModeSwitcher />
                </div>

                <Link
                    href="/logout"
                    external
                    className="flex gap-1.5 items-center cursor-pointer hover:text-primary transition group"
                >
                    <SignOut
                        weight="fill"
                        size={20}
                        className="rotate-180 mt-0.5"
                    />
                    {t.Logout}
                </Link>
            </div>
        </div>
    )

    if (useCollapsibleSidebar) {
        return (
            <Sheet>
                <header>
                    <SheetTrigger asChild>
                        <button
                            type="button"
                            className="px-4 pt-4 cursor-pointer"
                        >
                            <List size={20} />
                        </button>
                    </SheetTrigger>
                </header>

                <SheetContent title="Menu">{content}</SheetContent>
            </Sheet>
        )
    }

    return (
        <aside className={props.className}>
            <div className="h-full border-r border-subtle flex flex-col">
                {content}
            </div>
        </aside>
    )
}
