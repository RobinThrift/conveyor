import { BuildInfo } from "@/components/BuildInfo"
import * as Form from "@/components/Form"
import { SelectMode } from "@/components/ThemeSwitcher"
import { useBaseURL } from "@/hooks/useBaseURL"
import { useCSRFToken } from "@/hooks/useCSRFToken"
import { useT } from "@/i18n"
import { Password, User } from "@phosphor-icons/react"
import React from "react"

export interface LoginPageProps {
    redirectURL: string
    validationErrors?: {
        form?: string
    }
}

export function LoginPage(props: LoginPageProps) {
    let csrfToken = useCSRFToken()
    let baseURL = useBaseURL()
    let t = useT("pages/Login")

    return (
        <div className="h-screen px-2 sm:px-4">
            <header className="login-header">
                <div className="logo">Belt</div>
                <SelectMode className="mode-select" />
            </header>
            <div className="login-window">
                <h1>{t.Title}</h1>

                <Form.Root
                    action={`${baseURL}/login`}
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
                            name="username"
                            aria-label={t.UsernameLabel}
                            className="input-field"
                        >
                            <Form.Label htmlFor="username">
                                {t.UsernameLabel}
                            </Form.Label>

                            <User weight="bold" size={24} />

                            <Form.Control asChild>
                                <input
                                    type="text"
                                    name="username"
                                    id="username"
                                    autoComplete="username"
                                    required={true}
                                    placeholder={t.UsernameLabel}
                                />
                            </Form.Control>
                        </Form.Field>

                        <Form.Field
                            name="password"
                            aria-label={t.PasswordLabel}
                            className="input-field"
                        >
                            <Form.Label htmlFor="username">
                                {t.PasswordLabel}
                            </Form.Label>

                            <Password weight="bold" size={24} />

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
                    </div>

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
                                {t.LoginButton}
                            </button>
                        </Form.Submit>
                    </div>
                </Form.Root>
            </div>
            <footer className="login-footer">
                <BuildInfo />
            </footer>
        </div>
    )
}
