import React, { useCallback } from "react"

import { KeyboardIcon, PaletteIcon } from "@/ui/components/Icons"

import { Checkbox } from "@/ui/components/Input/Checkbox"
import { SelectColourScheme, SelectMode } from "@/ui/components/ThemeSwitcher"
import { useT } from "@/ui/i18n"
import { useSetting } from "@/ui/settings"

export function InterfaceSettingsTab() {
    let t = useT("screens/Settings/InterfaceSettings")

    let [controls, setControls] = useSetting("controls")

    let onChangeControlVim = useCallback(
        (v: boolean | "indeterminate") => {
            setControls({ ...controls, vim: v as boolean })
        },
        [controls, setControls],
    )

    let onChangeControlDoubleClickToEdit = useCallback(
        (v: boolean | "indeterminate") => {
            setControls({ ...controls, doubleClickToEdit: v as boolean })
        },
        [controls, setControls],
    )

    return (
        <>
            <header>
                <h2>{t.Title}</h2>
                <small className="settings-tab-description">
                    {t.Description}
                </small>
            </header>

            <div className="settings-section">
                <h3 className="settings-section-header">
                    <PaletteIcon className="icon" />
                    {t.SectionTheme}
                </h3>

                <div className="sm:mb-0 md:grid grid-cols-6 space-y-1">
                    <label
                        htmlFor="colourscheme"
                        className="flex items-center font-semibold text-sm"
                    >
                        {t.LabelColourScheme}
                    </label>
                    <SelectColourScheme className="col-span-5" />
                </div>

                <div className="md:grid grid-cols-6 space-y-1">
                    <label
                        htmlFor="mode"
                        className="flex items-center mt-4 sm:mt-0 font-semibold text-sm"
                    >
                        {t.LabelModeOverride}
                    </label>
                    <SelectMode className="col-span-5" />
                </div>
            </div>

            <div className="settings-section">
                <h3 className="settings-section-header">
                    <KeyboardIcon className="icon" />
                    {t.SectionControls}
                </h3>

                <div className="grid xs:grid-cols-2 gap-2 tablet:gap-4">
                    <Checkbox
                        label={t.LabelEnableVimKeybindings}
                        name="controls.vim"
                        value={controls.vim}
                        onChange={onChangeControlVim}
                    />
                    <Checkbox
                        label={t.LabelEnableDoubleClickToEdit}
                        name="controls.doubleClickEdit"
                        value={controls.doubleClickToEdit}
                        onChange={onChangeControlDoubleClickToEdit}
                    />
                </div>
            </div>
        </>
    )
}
