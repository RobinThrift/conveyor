import { Checkbox } from "@/components/Input/Checkbox"
import { Select } from "@/components/Select"
import { SelectColourScheme, SelectMode } from "@/components/ThemeSwitcher"
import { useBaseURL } from "@/hooks/useBaseURL"
import { useT } from "@/i18n"
import { useSetting } from "@/state/settings"
import React, { useCallback } from "react"

export const InterfaceSettingsTab = React.forwardRef<HTMLDivElement>(
    function InterfaceSettingsTab(_, forwardedRef) {
        let t = useT("pages/Settings/InterfaceSettingsTab")

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
            <div ref={forwardedRef} className="settings-tab">
                <div className="settings-tab-section">
                    <h2>{t.Title}</h2>
                    <small>{t.Description}</small>
                </div>

                <div className="settings-tab-section">
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
                            {t.LabelModeOverride}
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

                            <Select.Option value="fat-b">
                                <div className="icon-select-option">
                                    <img
                                        src={`${baseURL}/assets/icons/fat-b/pwa-192x192.png`}
                                        alt="fat-b"
                                    />
                                    <span>(Fat B)</span>
                                </div>
                            </Select.Option>
                        </Select>
                    </div>
                </div>

                <div className="settings-tab-section">
                    <h3>{t.SectionControls}</h3>

                    <div className="md:w-1/2">
                        <div className="space-y-2">
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
            </div>
        )
    },
)
