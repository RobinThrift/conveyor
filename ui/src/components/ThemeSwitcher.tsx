import { Select } from "@/components/Select"
import { useT } from "@/i18n"
import { useSetting } from "@/storage/settings"
import { Moon, Sun, SunHorizon } from "@phosphor-icons/react"
import React, { useCallback, useEffect } from "react"

export function ThemeSwitcher({
    className,
}: {
    className?: string
}) {
    let t = useT("components/ThemeSwitcher")
    let [colourScheme, setColourScheme] = useSetting("theme.colourScheme")
    let onChange = useCallback(
        (v: string) => {
            setColourScheme(v)
        },
        [setColourScheme],
    )

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
    let [mode, setMode] = useSetting("theme.mode")
    let onChange = useCallback(
        (v: string) => {
            setMode(v)
        },
        [setMode],
    )

    useEffect(() => {
        setModeOnDocument(mode as any)
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

function setModeOnDocument(mode: "auto" | "light" | "dark") {
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

    let bgColour = getComputedStyle(document.documentElement).getPropertyValue(
        "--body-bg",
    )

    document
        .querySelector("meta[name=theme-color]")
        ?.setAttribute("content", `rgb(${bgColour})`)
}
