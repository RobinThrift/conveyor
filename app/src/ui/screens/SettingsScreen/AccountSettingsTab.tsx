import { SignOut } from "@phosphor-icons/react"
import React from "react"

import { Button } from "@/ui/components/Button"
import * as Form from "@/ui/components/Form"
import { Input } from "@/ui/components/Input"
import { Link } from "@/ui/components/Link"
import { useBaseURL } from "@/ui/hooks/useBaseURL"
import { useCSRFToken } from "@/ui/hooks/useCSRFToken"
import { useT } from "@/ui/i18n"
import { useAccountDisplayName } from "@/ui/state/global/account"

import type { SettingsScreenProps } from "./SettingsScreen"

export const AccountSettingsTab = React.forwardRef<
    HTMLDivElement,
    Pick<SettingsScreenProps, "validationErrors">
>(function AccountSettingsTab({ validationErrors }, forwardedRef) {
    let displayName = useAccountDisplayName()
    let csrfToken = useCSRFToken()
    let baseURL = useBaseURL()

    let t = useT("screens/Settings/AccountSettings")

    return (
        <div ref={forwardedRef} className="settings-section-content">
            <Form.Root
                className="settings-sub-section"
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
                    defaultValue={displayName}
                    required
                    serverInvalid={!!validationErrors?.display_name}
                    message={validationErrors?.display_name}
                    messages={t}
                    className="sm:mb-0 md:grid grid-cols-6 space-y-1"
                    labelClassName="!font-semibold !text-sm items-center !mb-0 col-span-2"
                    inputWrapperClassName="col-span-4"
                />

                <div className="flex justify-end items-center mt-2">
                    <Button size="sm" type="submit">
                        {t.UpdateDisplayNameButton}
                    </Button>
                </div>
            </Form.Root>

            <Form.Root
                className="settings-sub-section"
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

                <div className="flex justify-end items-center mt-2">
                    <Button size="sm" type="submit">
                        {t.ChangePasswordButton}
                    </Button>
                </div>
            </Form.Root>

            <div className="settings-sub-section">
                <h2>{t.Logout}</h2>

                <Link href="/logout" external className="btn">
                    <SignOut
                        weight="fill"
                        size={20}
                        className="rotate-180 mt-0.5"
                    />
                    {t.Logout}
                </Link>
            </div>
        </div>
    )
})
