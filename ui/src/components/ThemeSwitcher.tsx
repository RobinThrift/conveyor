import { Select } from "@/components/Select"
import { useT } from "@/i18n"
import { useSetting } from "@/state/global/settings"
import { Moon, Sun, SunHorizon } from "@phosphor-icons/react"
import React, { useCallback } from "react"

export function SelectColourScheme({
    className,
}: {
    className?: string
}) {
    let t = useT("components/ThemeSwitcher")
    let [colourScheme, setColourScheme] = useSetting("theme.colourScheme")
    let onChange = useCallback(
        (v: typeof colourScheme) => {
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
            value={colourScheme}
        >
            <Select.Option value="default">{t.ColoursDefault}</Select.Option>
            <Select.Option value="warm">{t.ColoursWarm}</Select.Option>
            <Select.Option value="rosepine">{t.RosePine}</Select.Option>
        </Select>
    )
}

export function SelectMode({
    className,
}: {
    className?: string
}) {
    let t = useT("components/ThemeSwitcher")
    let [mode, setMode] = useSetting("theme.mode")
    let onChange = useCallback(
        (v: typeof mode) => {
            setMode(v)
        },
        [setMode],
    )

    return (
        <Select
            name="theme.mode"
            className={className}
            ariaLabel={t.SelectModeAriaLabel}
            onChange={onChange}
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
