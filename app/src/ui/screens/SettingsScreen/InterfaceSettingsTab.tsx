/** biome-ignore-all lint/a11y/useAriaPropsSupportedByRole: too many false positives */
import React, { useActionState, useCallback } from "react"

import { Button } from "@/ui/components/Button"
import { Form } from "@/ui/components/Form"
import { KeyboardIcon, MoonIcon, PaletteIcon, SunHorizonIcon, SunIcon } from "@/ui/components/Icons"
import { Checkbox } from "@/ui/components/Input/Checkbox"
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

    let [_, displayNameFormAction] = useActionState((_: unknown, formData: FormData) => {
        setDisplayName(formData.get("account.name")?.toString() ?? displayName)
    }, null)

    return (
        <>
            <header>
                <h2>{t.Title}</h2>
                <small className="settings-tab-description">{t.Description}</small>
            </header>

            <div className="settings-section">
                <Form className="input-field" action={displayNameFormAction}>
                    <label htmlFor="account.name" className="">
                        {t.NameInputLabel}
                    </label>
                    <input
                        type="text"
                        name="account.name"
                        className="input"
                        defaultValue={displayName}
                        required
                    />
                    <Button variant="primary" type="submit">
                        {t.NameInputSaveLabel}
                    </Button>
                </Form>
            </div>

            <div className="settings-section">
                <h3 className="settings-section-header">
                    <PaletteIcon className="icon" />
                    {t.SectionTheme}
                </h3>

                <ThemeSelection />
            </div>

            <div className="settings-section">
                <h3 className="settings-section-header">
                    <KeyboardIcon className="icon" />
                    {t.SectionControls}
                </h3>

                <Checkbox
                    label={t.LabelEnableVimKeybindings}
                    name="controls.vim"
                    value={controls.vim}
                    onChange={onChangeControlVim}
                />

                <hr />

                <Checkbox
                    label={t.LabelEnableDoubleClickToEdit}
                    name="controls.doubleClickEdit"
                    value={controls.doubleClickToEdit}
                    onChange={onChangeControlDoubleClickToEdit}
                />
            </div>
        </>
    )
}

function ThemeSelection() {
    let t = useT("screens/Settings/InterfaceSettings")
    let tColours = useT("ColourSchemes")
    let [lightColourScheme, setLightColourScheme] = useSetting("ui.colourScheme.light")
    let [_, setDarkColourScheme] = useSetting("ui.colourScheme.dark")
    let setColourScheme = useCallback(
        (v: typeof lightColourScheme) => {
            if (v === lightColourScheme) {
                return
            }

            document.documentElement.classList.add("theme-mode-transition")
            document.startViewTransition(() => {
                setLightColourScheme(v)
                setDarkColourScheme(v)
                requestAnimationFrame(() => {
                    document.documentElement.classList.remove("theme-mode-transition")
                })
            })
        },
        [lightColourScheme, setLightColourScheme, setDarkColourScheme],
    )

    let [mode, setModeValue] = useSetting("ui.colourScheme.mode")
    let setMode = useCallback(
        (v: typeof mode) => {
            if (v === mode) {
                return
            }

            document.documentElement.classList.add("theme-mode-transition")
            document.startViewTransition(() => {
                setModeValue(v)
                requestAnimationFrame(() => {
                    document.documentElement.classList.remove("theme-mode-transition")
                })
            })
        },
        [mode, setModeValue],
    )

    return (
        <div className="theme-selection">
            <div>
                <h4 className="theme-selection-label">{t.LabelColourScheme}</h4>
                <div
                    className="theme-selection-items"
                    role="radiogroup"
                    aria-orientation="horizontal"
                >
                    <button
                        type="button"
                        className="theme-selection-item"
                        role="radiogroup"
                        aria-checked={lightColourScheme === "default"}
                        tabIndex={0}
                        onClick={() => {
                            setColourScheme("default")
                        }}
                    >
                        {tColours.ColoursDefault}
                    </button>
                    <button
                        type="button"
                        className="theme-selection-item"
                        tabIndex={0}
                        aria-checked={lightColourScheme === "warm"}
                        onClick={() => {
                            setColourScheme("warm")
                        }}
                    >
                        {tColours.ColoursWarm}
                    </button>
                    <button
                        type="button"
                        className="theme-selection-item"
                        tabIndex={0}
                        aria-checked={lightColourScheme === "rosepine"}
                        onClick={() => {
                            setColourScheme("rosepine")
                        }}
                    >
                        {tColours.ColoursRosePine}
                    </button>
                </div>
            </div>

            <div>
                <h4 className="theme-selection-label">{t.LabelModeOverride}</h4>
                <div
                    className="theme-selection-items"
                    role="radiogroup"
                    aria-orientation="horizontal"
                >
                    {/* biome-ignore lint/a11y/useSemanticElements: this is correct according to the guidelines */}
                    <button
                        type="button"
                        className="theme-selection-item"
                        role="radio"
                        aria-checked={mode === "auto"}
                        tabIndex={0}
                        onClick={() => {
                            setMode("auto")
                        }}
                    >
                        <SunHorizonIcon className="icon" aria-hidden="true" />
                        {tColours.ModeAuto}
                    </button>

                    {/* biome-ignore lint/a11y/useSemanticElements: this is correct according to the guidelines */}
                    <button
                        type="button"
                        className="theme-selection-item"
                        role="radio"
                        aria-checked={mode === "light"}
                        tabIndex={0}
                        onClick={() => {
                            setMode("light")
                        }}
                    >
                        <SunIcon className="icon" aria-hidden="true" />
                        {tColours.ModeLight}
                    </button>

                    {/* biome-ignore lint/a11y/useSemanticElements: this is correct according to the guidelines */}
                    <button
                        type="button"
                        className="theme-selection-item"
                        role="radio"
                        aria-checked={mode === "dark"}
                        tabIndex={0}
                        onClick={() => {
                            setMode("dark")
                        }}
                    >
                        <MoonIcon className="icon" aria-hidden="true" />
                        {tColours.ModeDark}
                    </button>
                </div>
            </div>
        </div>
    )
}
