import { Input } from "@/components/Input"
import { ModeSwitcher } from "@/components/ThemeSwitcher"
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

    return (
        <div>
            <div className="login-bg">
                <div className="login-window">
                    <div className="flex flex-col items-center justify-center">
                        <h3 className="text-2xl mt-8 mb-3 font-semibold text-primary-extra-dark dark:text-text">
                            {t.Title}
                        </h3>
                    </div>
                    <Form.Root
                        action={`${baseURL}/auth/change_password`}
                        method="post"
                        className="w-full"
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

                        <div className="flex flex-col px-3 py-2 w-full">
                            <Input
                                type="password"
                                name="current_password"
                                ariaLabel={t.CurrentPasswordLabel}
                                icon={<Password />}
                                serverInvalid={
                                    !!props.validationErrors?.current_password
                                }
                                inputClassName="rounded-b-none !border-b-transparent hover:border-b-subtle-dark focus:border-b-subtle-dark focus:z-10 relative"
                                iconClassName="z-20"
                                messageClassName="mt-0"
                                autoComplete="current_password"
                                placeholder={t.CurrentPasswordLabel}
                                required
                                autoFocus
                            />

                            <Input
                                name="new_password"
                                type="password"
                                ariaLabel={t.NewPasswordLabel}
                                icon={<Password />}
                                serverInvalid={
                                    !!props.validationErrors?.new_password
                                }
                                inputClassName="rounded-t-none !border-b-transparent hover:border-b-subtle-dark focus:border-b-subtle-dark focus:z-10 relative"
                                iconClassName="z-20"
                                autoComplete="new_password"
                                placeholder={t.NewPasswordLabel}
                                required
                            />

                            <Input
                                name="repeat_new_password"
                                type="password"
                                ariaLabel={t.RepeatNewPasswordLabel}
                                icon={<Password />}
                                serverInvalid={
                                    !!props.validationErrors
                                        ?.repeat_new_password
                                }
                                inputClassName="rounded-t-none hover:border-b-subtle-dark focus:border-b-subtle-dark"
                                autoComplete="repeat_new_password"
                                placeholder={t.RepeatNewPasswordLabel}
                                required
                            />

                            <Form.Submit asChild>
                                <button
                                    className="btn primary mt-5"
                                    type="submit"
                                >
                                    Change Password
                                </button>
                            </Form.Submit>
                        </div>

                        {props.validationErrors &&
                            Object.values(props.validationErrors).map((v) => (
                                <div
                                    key={v}
                                    className="mt-5 field-message animate-in slide-in-from-bottom fade-in-50 duration-300"
                                >
                                    {t[v as keyof typeof t] ?? v}
                                </div>
                            ))}
                    </Form.Root>
                </div>
            </div>
            <footer className="p-2 flex justify-end absolute bottom-0 left-0 right-0">
                <ModeSwitcher className="max-w-sm" />
            </footer>
        </div>
    )
}
