import React, { useActionState, useCallback } from "react"

import { KeyboardIcon, PaletteIcon } from "@/ui/components/Icons"

import { Button } from "@/ui/components/Button"
import { Form } from "@/ui/components/Form"
import { Checkbox } from "@/ui/components/Input/Checkbox"
import { SelectColourScheme, SelectMode } from "@/ui/components/ThemeSwitcher"
import { useT } from "@/ui/i18n"
import { useSetting } from "@/ui/settings"

export function InterfaceSettingsTab() {
    let t = useT("screens/Settings/InterfaceSettings")

    let [controls, setControls] = useSetting("controls")

    let [displayName, setDisplayName] = useSetting("account.displayName")

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

    let [_, displayNameFormAction] = useActionState(
        (_: unknown, formData: FormData) => {
            setDisplayName(
                formData.get("account.name")?.toString() ?? displayName,
            )
        },
        null,
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
                <Form
                    className="input-field sm:mb-0 md:grid grid-cols-6 space-y-1 sm:space-y-0 lg:gap-2"
                    action={displayNameFormAction}
                >
                    <label
                        htmlFor="account.name"
                        className="flex items-center mt-4 sm:mt-0 font-semibold text-sm"
                    >
                        {t.NameInputLabel}
                    </label>
                    <input
                        type="text"
                        name="account.name"
                        className="input py-1.5 px-1.5 col-span-5 lg:col-span-4"
                        defaultValue={displayName}
                        required
                    />
                    <Button
                        variant="primary"
                        type="submit"
                        className="mt-1 col-start-6 lg:py-1 lg:mt-0"
                    >
                        {t.NameInputSaveLabel}
                    </Button>
                </Form>
            </div>

            <div className="settings-section">
                <h3 className="settings-section-header">
                    <PaletteIcon className="icon" />
                    {t.SectionTheme}
                </h3>

                <div className="sm:mb-0 md:grid grid-cols-6 space-y-2">
                    <label
                        htmlFor="colourscheme"
                        className="flex items-center font-semibold text-sm"
                    >
                        {t.LabelColourScheme}
                    </label>
                    <SelectColourScheme
                        fieldClassName="col-span-5"
                        wrapperClassName="w-full"
                    />
                </div>

                <div className="md:grid grid-cols-6 mt-2 space-y-2">
                    <label
                        htmlFor="mode"
                        className="flex items-center mt-4 sm:mt-0 font-semibold text-sm"
                    >
                        {t.LabelModeOverride}
                    </label>
                    <SelectMode
                        fieldClassName="col-span-5"
                        wrapperClassName="w-full"
                    />
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
