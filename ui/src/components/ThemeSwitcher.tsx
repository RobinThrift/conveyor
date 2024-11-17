import { Select } from "@/components/Select"
import { useT } from "@/i18n"
import { persistentAtom } from "@nanostores/persistent"
import { useStore } from "@nanostores/react"
import { Moon, Sun, SunHorizon } from "@phosphor-icons/react"
import React, { useEffect } from "react"

type Mode = "auto" | "light" | "dark"

const modeStore = persistentAtom<Mode>("belt.mode", "auto")

export function ThemeSwitcher({
    className,
}: {
    className?: string
}) {
    let mode = useStore(modeStore)
    let t = useT("components/ThemeSwitcher")

    useEffect(() => {
        switch (mode) {
            case "auto":
                document.documentElement.classList.toggle(
                    "dark",
                    window.matchMedia("(prefers-color-scheme: dark)").matches,
                )
                break
            case "light":
                document.documentElement.classList.remove("dark")
                break
            case "dark":
                document.documentElement.classList.add("dark")
                break
        }
    }, [mode])

    return (
        <Select
            className={className}
            name="theme"
            ariaLabel="Theme Switcher"
            onChange={modeStore.set}
            value={mode}
        >
            <Select.Option value="auto">
                <div className="flex gap-2 items-center">
                    <SunHorizon weight="duotone" />
                    {t.Auto}
                </div>
            </Select.Option>

            <Select.Option value="light">
                <div className="flex gap-2 items-center">
                    <Sun weight="duotone" />
                    {t.Light}
                </div>
            </Select.Option>

            <Select.Option value="dark">
                <div className="flex gap-2 items-center">
                    <Moon weight="duotone" />
                    {t.Dark}
                </div>
            </Select.Option>
        </Select>
    )
}
