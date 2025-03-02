import React from "react"

import { BuildInfo } from "@/ui/components/BuildInfo"
import * as Form from "@/ui/components/Form"
import { PasswordIcon } from "@/ui/components/Icons"
import { SelectMode } from "@/ui/components/ThemeSwitcher"
import { useBaseURL } from "@/ui/hooks/useBaseURL"
import { useT } from "@/ui/i18n"

export interface UnlockScreenProps {
    validationErrors?: {
        form?: string
    }
}

export function UnlockScreen(props: UnlockScreenProps) {
    let baseURL = useBaseURL()
    let t = useT("screens/Unlock")

    return (
        <div className="unlock-screen">
            <div className="unlock-screen-bg" aria-hidden>
                <div className="spot-3" />
                <div className="spot-2" />
                <div className="spot-1" />
                <div className="noise" />
            </div>

            <div className="logo" aria-hidden>
                <span className="eeee">eeeeeeeeeeeeeeee</span>
                <span>
                    B<em>e</em>lt
                </span>
            </div>

            <header className="unlock-screen-header">
                <SelectMode className="mode-select" />
            </header>

            <div className="unlock-window-positioner">
                <div className="unlock-window">
                    <h1>{t.Title}</h1>

                    <Form.Root
                        action={`${baseURL}/unlock`}
                        method="post"
                        className="p-4"
                    >
                        <Form.Field
                            name="password"
                            aria-label={t.PasswordLabel}
                            className="input-field"
                        >
                            <Form.Label htmlFor="username">
                                {t.PasswordLabel}
                            </Form.Label>

                            <PasswordIcon weight="bold" size={24} />

                            <Form.Control asChild>
                                <input
                                    type="password"
                                    name="password"
                                    id="password"
                                    autoComplete="password"
                                    required={true}
                                    placeholder={t.PasswordLabel}
                                />
                            </Form.Control>
                        </Form.Field>

                        {props.validationErrors?.form && (
                            <div className="mt-4 field-message">
                                {props.validationErrors.form}
                            </div>
                        )}

                        <div className="flex items-center justify-end mt-4">
                            <Form.Submit asChild>
                                <button
                                    className="btn primary lg w-full"
                                    type="submit"
                                >
                                    {t.UnlockButton}
                                </button>
                            </Form.Submit>
                        </div>
                    </Form.Root>
                </div>
            </div>
            <footer className="unlock-footer">
                <BuildInfo />
            </footer>
        </div>
    )
}
