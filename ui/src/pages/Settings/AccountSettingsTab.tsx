import { Button } from "@/components/Button"
import * as Form from "@/components/Form"
import { Input } from "@/components/Input"
import { useBaseURL } from "@/hooks/useBaseURL"
import { useCSRFToken } from "@/hooks/useCSRFToken"
import { useT } from "@/i18n"
import { useAccount } from "@/storage/account"
import React from "react"
import type { SettingsPageProps } from "./SettingsPage"

export const AccountSettingsTab = React.forwardRef<
    HTMLDivElement,
    Pick<SettingsPageProps, "validationErrors">
>(function AccountSettingsTab({ validationErrors }, forwardedRef) {
    let account = useAccount()
    let csrfToken = useCSRFToken()
    let baseURL = useBaseURL()

    let t = useT("pages/Settings/AccountSettingsTab")

    return (
        <div ref={forwardedRef} className="settings-tab">
            <div className="settings-tab-section">
                <h2>{t.Title}</h2>
                <small>{t.Description}</small>
            </div>

            <Form.Root
                className="settings-tab-section"
                action={`${baseURL}/settings/account/update_info`}
                method="post"
            >
                <input
                    type="hidden"
                    name="belt.csrf.token"
                    defaultValue={csrfToken}
                />

                <Input
                    name="display_name"
                    label={t.DisplayNameLabel}
                    defaultValue={account.displayName as string}
                    required
                    serverInvalid={!!validationErrors?.display_name}
                    message={validationErrors?.display_name}
                    messages={t}
                    className="sm:mb-0 md:grid grid-cols-6 space-y-1"
                    labelClassName="!font-semibold !text-sm items-center !mb-0 col-span-2"
                    inputWrapperClassName="col-span-4"
                />

                <div className="flex justify-end items-center">
                    <Button size="sm" variant="primary" type="submit">
                        {t.UpdateDisplayNameButton}
                    </Button>
                </div>
            </Form.Root>

            <Form.Root
                className="settings-tab-section"
                action={`${baseURL}/settings/account/change_password`}
                method="post"
            >
                <h3>{t.ChangePasswordTitle}</h3>

                <input
                    type="hidden"
                    name="belt.csrf.token"
                    defaultValue={csrfToken}
                />

                <Input
                    name="current_password"
                    type="password"
                    label={t.CurrentPasswordLabel}
                    ariaLabel={t.CurrentPasswordLabel}
                    autoComplete="current_password"
                    required
                    serverInvalid={!!validationErrors?.current_password}
                    message={validationErrors?.current_password}
                    messages={t}
                    className="sm:mb-0 md:grid grid-cols-6 space-y-1"
                    labelClassName="!font-semibold !text-sm items-center !mb-0 col-span-2"
                    inputWrapperClassName="col-span-4"
                    messageClassName="col-span-6"
                />

                <Input
                    name="new_password"
                    type="password"
                    label={t.NewPasswordLabel}
                    ariaLabel={t.NewPasswordLabel}
                    autoComplete="new_password"
                    required
                    serverInvalid={!!validationErrors?.new_password}
                    message={validationErrors?.new_password}
                    messages={t}
                    className="sm:mb-0 md:grid grid-cols-6 space-y-1"
                    labelClassName="!font-semibold !text-sm items-center !mb-0 col-span-2"
                    inputWrapperClassName="col-span-4"
                    messageClassName="col-span-6"
                />

                <Input
                    name="repeat_new_password"
                    type="password"
                    label={t.RepeatNewPasswordLabel}
                    ariaLabel={t.RepeatNewPasswordLabel}
                    autoComplete="repeat_new_password"
                    required
                    serverInvalid={!!validationErrors?.repeat_new_password}
                    message={validationErrors?.repeat_new_password}
                    messages={t}
                    className="sm:mb-0 md:grid grid-cols-6 space-y-1"
                    labelClassName="!font-semibold !text-sm items-center !mb-0 col-span-2"
                    inputWrapperClassName="col-span-4"
                    messageClassName="col-span-6"
                />

                <div className="flex justify-end items-center">
                    <Button size="sm" variant="primary" type="submit">
                        {t.ChangePasswordButton}
                    </Button>
                </div>
            </Form.Root>
        </div>
    )
})
