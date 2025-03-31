import React, { useCallback } from "react"

import { Checkbox } from "@/ui/components/Input/Checkbox"
import { Select } from "@/ui/components/Select"
import { SelectColourScheme, SelectMode } from "@/ui/components/ThemeSwitcher"
import { useBaseURL } from "@/ui/hooks/useBaseURL"
import { useT } from "@/ui/i18n"
import { useSetting } from "@/ui/settings"

export function InterfaceSettingsTab({
    ref,
}: { ref?: React.Ref<HTMLDivElement> }) {
    let t = useT("screens/Settings/InterfaceSettings")

    let baseURL = useBaseURL()

    let [controls, setControls] = useSetting("controls")

    let [icon, setIcon] = useSetting("theme.icon")

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
        <div ref={ref} className="settings-section-content">
            <div className="settings-sub-section">
                <h3>{t.SectionTheme}</h3>

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

                <div className="md:grid grid-cols-6 space-y-1">
                    <label
                        htmlFor="mode"
                        className="flex items-center mt-4 sm:mt-0 font-semibold text-sm"
                    >
                        {t.LabelIcon}
                    </label>
                    <Select
                        className="col-span-5"
                        name="icon"
                        ariaLabel={t.LabelIcon}
                        onChange={setIcon}
                        value={icon}
                    >
                        <Select.Option value="default">
                            <div className="icon-select-option">
                                <img
                                    src={`${baseURL}/assets/icons/default/pwa-192x192.png`}
                                    alt="default"
                                />
                                <span>(Default)</span>
                            </div>
                        </Select.Option>
                    </Select>
                </div>
            </div>

            <div className="settings-sub-section">
                <h3>{t.SectionControls}</h3>

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
        </div>
    )
}
