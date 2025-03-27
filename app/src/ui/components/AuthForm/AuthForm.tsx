import React from "react"

import { Button } from "@/ui/components/Button"
import { Dialog } from "@/ui/components/Dialog"
import { Form } from "@/ui/components/Form"
import { Input } from "@/ui/components/Input"
import { Loader } from "@/ui/components/Loader"
import { useT } from "@/ui/i18n"
import type { AuthStatus } from "@/ui/state"

import {
    type ChangePasswordArgs,
    ChangePasswordForm,
} from "./ChangePasswordForm"
import { type LoginArgs, useAuthFormState } from "./useAuthFormState"

export type { LoginArgs } from "./useAuthFormState"

export interface AuthFormProps {
    className?: string
    login: (args: LoginArgs) => void
    changePassword: (args: ChangePasswordArgs) => void
    status: AuthStatus
    error?: Error
}

export function AuthForm(props: AuthFormProps) {
    let t = useT("components/AuthForm")
    let {
        username,
        isLoading,
        showChangePasswordDialog,
        cancelPasswordChangeDialog,
        onSubmit,
    } = useAuthFormState(props)

    return (
        <div className={props.className}>
            <Form
                className="space-y-4 relative"
                action="#"
                method="post"
                onSubmit={onSubmit}
            >
                <Input
                    name="username"
                    type="text"
                    label={t.FieldUsernameLabel}
                    ariaLabel={t.FieldUsernameLabel}
                    autoComplete="username"
                    required
                    messages={t}
                    className="md:grid grid-cols-6 space-y-1"
                    labelClassName="!mb-0 !font-semibold !text-sm items-center col-span-2"
                    inputWrapperClassName="col-span-4"
                    messageClassName="col-span-6"
                    disabled={isLoading || showChangePasswordDialog}
                />

                <Input
                    name="password"
                    type="password"
                    label={t.FieldPasswordLabel}
                    ariaLabel={t.FieldPasswordLabel}
                    autoComplete="password"
                    required
                    messages={t}
                    className="md:grid grid-cols-6 space-y-1"
                    labelClassName="!mb-0 !font-semibold !text-sm items-center col-span-2"
                    inputWrapperClassName="col-span-4"
                    messageClassName="col-span-6"
                    disabled={isLoading || showChangePasswordDialog}
                />

                <Input
                    name="server"
                    type="text"
                    label={t.FieldServerLabel}
                    ariaLabel={t.FieldServerLabel}
                    messages={t}
                    className="md:grid grid-cols-6 space-y-1"
                    labelClassName="!mb-0 !font-semibold !text-sm items-center col-span-2"
                    inputWrapperClassName="col-span-4"
                    messageClassName="col-span-6"
                    disabled={isLoading || showChangePasswordDialog}
                />

                <div className="flex justify-end items-center mt-2">
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={isLoading}
                    >
                        {t.AuthenticateButtonLabel}
                    </Button>
                </div>

                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/40 z-10">
                        <Loader />
                    </div>
                )}

                {props.error && props.status === "error" && (
                    <Form.Message messages={t} error={props.error} />
                )}
            </Form>

            <Dialog
                modal={true}
                dismissible={false}
                defaultOpen={showChangePasswordDialog}
                open={showChangePasswordDialog}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        cancelPasswordChangeDialog()
                    }
                }}
            >
                <Dialog.Content className="change-password-dialog">
                    <Dialog.Title>
                        {t.ChangePasswordFormDialogTitle}
                    </Dialog.Title>
                    <Dialog.Description>
                        {t.ChangePasswordFormDialogDescription}
                    </Dialog.Description>

                    <ChangePasswordForm
                        username={username}
                        changePassword={props.changePassword}
                        status={props.status}
                        error={props.error}
                    />
                </Dialog.Content>
            </Dialog>
        </div>
    )
}
