import React, { useCallback } from "react"

import { DEFAULT_SETTINGS } from "@/domain/Settings"
import { MoonIcon, SunHorizonIcon, SunIcon } from "@/ui/components/Icons"
import { Select } from "@/ui/components/Select"
import { useT } from "@/ui/i18n"
import { useSetting } from "@/ui/settings"

export function SelectColourScheme({
    className,
    fieldClassName,
    wrapperClassName,
}: {
    className?: string
    fieldClassName?: string
    wrapperClassName?: string
}) {
    let t = useT("components/ThemeSwitcher")
    let [lightColourScheme, setLightColourScheme] = useSetting(
        "ui.colourScheme.light",
    )
    let [_, setDarkColourScheme] = useSetting("ui.colourScheme.dark")
    let onChange = useCallback(
        (v?: typeof lightColourScheme) => {
            setLightColourScheme(v ?? DEFAULT_SETTINGS.ui.colourScheme.light)
            setDarkColourScheme(v ?? DEFAULT_SETTINGS.ui.colourScheme.light)
        },
        [setLightColourScheme, setDarkColourScheme],
    )

    return (
        <Select
            className={className}
            fieldClassName={fieldClassName}
            wrapperClassName={wrapperClassName}
            name="theme.colourScheme"
            label={t.SelectColourSchemeAriaLabel}
            labelClassName="sr-only"
            onChange={onChange}
            value={lightColourScheme}
        >
            <Select.Option value="default">{t.ColoursDefault}</Select.Option>
            <Select.Option value="warm">{t.ColoursWarm}</Select.Option>
            <Select.Option value="rosepine">{t.RosePine}</Select.Option>
        </Select>
    )
}

export function SelectMode({
    className,
    fieldClassName,
    wrapperClassName,
}: {
    className?: string
    fieldClassName?: string
    wrapperClassName?: string
}) {
    let t = useT("components/ThemeSwitcher")
    let [mode, setMode] = useSetting("ui.colourScheme.mode")
    let onChange = useCallback(
        (v?: typeof mode) => {
            if (v === mode) {
                setMode(v ?? DEFAULT_SETTINGS.ui.colourScheme.mode)
            } else {
                document.documentElement.classList.add("theme-mode-transition")
                document.startViewTransition(() => {
                    setMode(v ?? DEFAULT_SETTINGS.ui.colourScheme.mode)
                    requestAnimationFrame(() => {
                        document.documentElement.classList.remove(
                            "theme-mode-transition",
                        )
                    })
                })
            }
        },
        [mode, setMode],
    )

    return (
        <Select
            name="theme.mode"
            className={className}
            fieldClassName={fieldClassName}
            wrapperClassName={wrapperClassName}
            label={t.SelectModeAriaLabel}
            labelClassName="sr-only"
            onChange={onChange}
            value={mode}
        >
            <Select.Option value="auto">
                <div className="flex gap-2 items-center">
                    <SunHorizonIcon weight="duotone" />
                    {t.Auto}
                </div>
            </Select.Option>

            <Select.Option value="light">
                <div className="flex gap-2 items-center">
                    <SunIcon weight="duotone" />
                    {t.Light}
                </div>
            </Select.Option>

            <Select.Option value="dark">
                <div className="flex gap-2 items-center">
                    <MoonIcon weight="duotone" />
                    {t.Dark}
                </div>
            </Select.Option>
        </Select>
    )
}
