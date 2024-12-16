import { BuildInfo } from "@/components/BuildInfo"
import { SelectMode } from "@/components/ThemeSwitcher"
import { useBaseURL } from "@/hooks/useBaseURL"
import { useCSRFToken } from "@/hooks/useCSRFToken"
import { useT } from "@/i18n"
import { Password } from "@phosphor-icons/react"
import * as Form from "@radix-ui/react-form"
import React from "react"

export interface ChangePasswordPageProps {
    redirectURL: string
    validationErrors?: {
        form?: string
        current_password?: string
        new_password?: string
        repeat_new_password?: string
    }
}

export function ChangePasswordPage(props: ChangePasswordPageProps) {
    let csrfToken = useCSRFToken()
    let baseURL = useBaseURL()
    let t = useT("pages/LoginChangePassword")
    console.log("t", t)

    return (
        <div className="h-screen px-2 sm:px-4">
            <header className="login-header">
                <div className="logo">Belt</div>
                <SelectMode className="mode-select" />
            </header>
            <div className="login-window">
                <h1 className="!text-6xl">{t.Title}</h1>

                <Form.Root
                    action={`${baseURL}/auth/change_password`}
                    method="post"
                    className="p-4"
                >
                    <input
                        type="hidden"
                        id="belt.csrf.token"
                        name="belt.csrf.token"
                        defaultValue={csrfToken}
                    />

                    <input
                        type="hidden"
                        id="redirect_url"
                        name="redirect_url"
                        defaultValue={props.redirectURL}
                    />

                    <div className="space-y-2">
                        <Form.Field
                            name="current_password"
                            aria-label={t.CurrentPasswordLabel}
                            className="input-field"
                            serverInvalid={
                                !!props.validationErrors?.current_password
                            }
                        >
                            <Form.Label htmlFor="current_password">
                                {t.CurrentPasswordLabel}
                            </Form.Label>

                            <Password weight="bold" size={24} />

                            <Form.Control asChild>
                                <input
                                    type="password"
                                    name="current_password"
                                    id="current_password"
                                    autoComplete="current_password"
                                    placeholder={t.CurrentPasswordLabel}
                                    required
                                />
                            </Form.Control>
                        </Form.Field>

                        <Form.Field
                            name="new_password"
                            aria-label={t.NewPasswordLabel}
                            className="input-field"
                            serverInvalid={
                                !!props.validationErrors?.new_password
                            }
                        >
                            <Form.Label htmlFor="new_password">
                                {t.NewPasswordLabel}
                            </Form.Label>

                            <Password weight="bold" size={24} />

                            <Form.Control asChild>
                                <input
                                    type="password"
                                    name="new_password"
                                    id="new_password"
                                    autoComplete="new_password"
                                    placeholder={t.NewPasswordLabel}
                                    required
                                />
                            </Form.Control>
                        </Form.Field>

                        <Form.Field
                            name="repeate_new_password"
                            aria-label={t.RepeatNewPasswordLabel}
                            className="input-field"
                            serverInvalid={
                                !!props.validationErrors?.repeat_new_password
                            }
                        >
                            <Form.Label htmlFor="repeate_new_password">
                                {t.RepeatNewPasswordLabel}
                            </Form.Label>

                            <Password weight="bold" size={24} />

                            <Form.Control asChild>
                                <input
                                    type="password"
                                    name="repeate_new_password"
                                    id="repeate_new_password"
                                    autoComplete="repeate_new_password"
                                    placeholder={t.RepeatNewPasswordLabel}
                                    required
                                />
                            </Form.Control>
                        </Form.Field>

                        {props.validationErrors &&
                            Object.values(props.validationErrors).map((v) => (
                                <div key={v} className="mt-5 field-message">
                                    {t[v as keyof typeof t] ?? v}
                                </div>
                            ))}

                        <div className="flex items-center justify-end mt-4">
                            <Form.Submit asChild>
                                <button
                                    className="btn primary lg w-full"
                                    type="submit"
                                >
                                    {t.ChangePasswordButton}
                                </button>
                            </Form.Submit>
                        </div>
                    </div>
                </Form.Root>
            </div>
            <footer className="login-footer">
                <BuildInfo />
                <SelectMode className="max-w-sm" />
            </footer>
        </div>
    )
}
