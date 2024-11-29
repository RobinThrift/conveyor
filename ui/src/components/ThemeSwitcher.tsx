import { Select } from "@/components/Select"
import { useT } from "@/i18n"
import { settingsStore, useSetting } from "@/storage/settings"
import { Moon, Sun, SunHorizon } from "@phosphor-icons/react"
import React, { useCallback, useEffect } from "react"

export function ThemeSwitcher({
    className,
}: {
    className?: string
}) {
    let t = useT("components/ThemeSwitcher")
    let [colourScheme] = useSetting("theme.colourScheme")
    let onChange = useCallback((v: string) => {
        settingsStore.set("theme.colourScheme", v)
    }, [])

    return (
        <Select
            className={className}
            name="theme.colourScheme"
            ariaLabel={t.SelectColourSchemeAriaLabel}
            onChange={onChange}
            value={colourScheme as string}
        >
            <Select.Option value="default">{t.ColoursDefault}</Select.Option>
        </Select>
    )
}

export function ModeSwitcher({
    className,
}: {
    className?: string
}) {
    let t = useT("components/ThemeSwitcher")
    let [mode] = useSetting("theme.mode")
    let onChange = useCallback((v: string) => {
        settingsStore.set("theme.mode", v)
    }, [])

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
            name="theme.mode"
            className={className}
            ariaLabel={t.SelectModeAriaLabel}
            onChange={onChange}
            value={mode as string}
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
