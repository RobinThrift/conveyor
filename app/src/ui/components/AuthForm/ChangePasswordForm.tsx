import clsx from "clsx"
import React, { useCallback, useMemo } from "react"

import type { PlaintextPassword } from "@/auth/credentials"
import { Button } from "@/ui/components/Button"
import { Form } from "@/ui/components/Form"
import { Input } from "@/ui/components/Input"
import { Loader } from "@/ui/components/Loader"
import { useT } from "@/ui/i18n"
import type { AuthStatus } from "@/ui/state"

export interface ChangePasswordArgs {
    username: string
    currentPassword: PlaintextPassword
    newPassword: PlaintextPassword
    newPasswordRepeat: PlaintextPassword
}

export interface ChangePasswordFormProps {
    className?: string
    username: string
    changePassword: (args: ChangePasswordArgs) => void
    status: AuthStatus
    error?: Error
}

export function ChangePasswordForm(props: ChangePasswordFormProps) {
    let t = useT("components/AuthForm/ChangePasswordForm")
    let isLoading = useMemo(
        () => props.status === "password-change-in-progress",
        [props.status],
    )

    let onSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            e.stopPropagation()

            let target = e.target as HTMLFormElement

            let currentPassword = target.querySelector(
                "#current_password",
            ) as HTMLInputElement
            let newPassword = target.querySelector(
                "#new_password",
            ) as HTMLInputElement
            let newPasswordRepeat = target.querySelector(
                "#repeat_new_password",
            ) as HTMLInputElement

            props.changePassword({
                username: props.username,
                currentPassword: currentPassword.value as PlaintextPassword,
                newPassword: newPassword.value as PlaintextPassword,
                newPasswordRepeat: newPasswordRepeat.value as PlaintextPassword,
            })
        },
        [props.username, props.changePassword],
    )

    return (
        <Form
            className={clsx("space-y-4 relative", props.className)}
            action="#"
            method="post"
            onSubmit={onSubmit}
        >
            <Input
                name="current_password"
                type="password"
                label={t.FieldCurrentPasswordLabel}
                ariaLabel={t.FieldCurrentPasswordLabel}
                autoComplete="current_password"
                required
                messages={t}
                className="md:grid grid-cols-6 space-y-1"
                labelClassName="!font-semibold !text-sm items-center !mb-0 col-span-2"
                inputWrapperClassName="col-span-4"
                messageClassName="col-span-6"
                disabled={isLoading}
            />

            <Input
                name="new_password"
                type="password"
                label={t.FieldNewPasswordLabel}
                ariaLabel={t.FieldNewPasswordLabel}
                autoComplete="new_password"
                required
                messages={t}
                className="md:grid grid-cols-6 space-y-1"
                labelClassName="!font-semibold !text-sm items-center !mb-0 col-span-2"
                inputWrapperClassName="col-span-4"
                messageClassName="col-span-6"
                disabled={isLoading}
            />

            <Input
                name="repeat_new_password"
                type="password"
                label={t.FieldRepeatNewPasswordLabel}
                ariaLabel={t.FieldRepeatNewPasswordLabel}
                autoComplete="repeat_new_password"
                required
                messages={t}
                className="md:grid grid-cols-6 space-y-1"
                labelClassName="!font-semibold !text-sm items-center !mb-0 col-span-2"
                inputWrapperClassName="col-span-4"
                messageClassName="col-span-6"
                disabled={isLoading}
            />

            <div className="flex justify-end items-center mt-2">
                <Button type="submit" disabled={isLoading}>
                    {t.ChangePasswordButtonLabel}
                </Button>
            </div>

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/40 z-10">
                    <Loader />
                </div>
            )}

            {props.error && props.status === "password-change-error" && (
                <Form.Message messages={t} error={props.error} />
            )}
        </Form>
    )
}
