import React from "react"

import { Button } from "@/ui/components/Button"
import * as Form from "@/ui/components/Form"
import { Input } from "@/ui/components/Input"
import { Checkbox } from "@/ui/components/Input/Checkbox"
import { useT } from "@/ui/i18n"
import { useSetting } from "@/ui/settings"

export const SyncSettingsTab = React.forwardRef<HTMLDivElement>(
    function SyncSettingsTab(_, forwardedRef) {
        return (
            <div ref={forwardedRef} className="settings-section-content">
                <SectionInfo />
                <SectionSetupSync />
                <SectionChangePassword />
            </div>
        )
    },
)

function SectionInfo() {
    let t = useT("screens/Settings/SyncSettings/Info")
    let [isEnabled, setIsEnabled] = useSetting("sync.isEnabled")
    return (
        <div className="settings-sub-section">
            <Checkbox
                label={t.IsEnabled}
                name="is_enabled"
                value={isEnabled}
                onChange={(checked) => setIsEnabled(checked as boolean)}
            />
        </div>
    )
}

function SectionSetupSync() {
    let t = useT("screens/Settings/SyncSettings/Setup")

    return (
        <Form.Root className="settings-sub-section" action="#" method="post">
            <h3>{t.Title}</h3>

            <Input
                name="username"
                type="text"
                label={t.FieldUsernameLabel}
                ariaLabel={t.FieldUsernameLabel}
                autoComplete="username"
                required
                // serverInvalid={!!validationErrors?.current_password}
                // message={validationErrors?.current_password}
                messages={t}
                className="sm:mb-0 md:grid grid-cols-6 space-y-1"
                labelClassName="!font-semibold !text-sm items-center !mb-0 col-span-2"
                inputWrapperClassName="col-span-4"
                messageClassName="col-span-6"
            />

            <Input
                name="password"
                type="password"
                label={t.FieldPasswordLabel}
                ariaLabel={t.FieldPasswordLabel}
                autoComplete="password"
                required
                // serverInvalid={!!validationErrors?.new_password}
                // message={validationErrors?.new_password}
                messages={t}
                className="sm:mb-0 md:grid grid-cols-6 space-y-1"
                labelClassName="!font-semibold !text-sm items-center !mb-0 col-span-2"
                inputWrapperClassName="col-span-4"
                messageClassName="col-span-6"
            />

            <div className="flex justify-end items-center mt-2">
                <Button size="sm" type="submit">
                    {t.LoginButtonLabel}
                </Button>
            </div>
        </Form.Root>
    )
}

function SectionChangePassword() {
    let t = useT("screens/Settings/SyncSettings/ChangePassword")

    return (
        <Form.Root className="settings-sub-section" action="#" method="post">
            <h3>{t.Title}</h3>

            <Input
                name="current_password"
                type="password"
                label={t.FieldCurrentPasswordLabel}
                ariaLabel={t.FieldCurrentPasswordLabel}
                autoComplete="current_password"
                required
                // serverInvalid={!!validationErrors?.current_password}
                // message={validationErrors?.current_password}
                messages={t}
                className="sm:mb-0 md:grid grid-cols-6 space-y-1"
                labelClassName="!font-semibold !text-sm items-center !mb-0 col-span-2"
                inputWrapperClassName="col-span-4"
                messageClassName="col-span-6"
            />

            <Input
                name="new_password"
                type="password"
                label={t.FieldNewPasswordLabel}
                ariaLabel={t.FieldNewPasswordLabel}
                autoComplete="new_password"
                required
                // serverInvalid={!!validationErrors?.new_password}
                // message={validationErrors?.new_password}
                messages={t}
                className="sm:mb-0 md:grid grid-cols-6 space-y-1"
                labelClassName="!font-semibold !text-sm items-center !mb-0 col-span-2"
                inputWrapperClassName="col-span-4"
                messageClassName="col-span-6"
            />

            <Input
                name="repeat_new_password"
                type="password"
                label={t.FieldRepeatNewPasswordLabel}
                ariaLabel={t.FieldRepeatNewPasswordLabel}
                autoComplete="repeat_new_password"
                required
                // serverInvalid={!!validationErrors?.repeat_new_password}
                // message={validationErrors?.repeat_new_password}
                messages={t}
                className="sm:mb-0 md:grid grid-cols-6 space-y-1"
                labelClassName="!font-semibold !text-sm items-center !mb-0 col-span-2"
                inputWrapperClassName="col-span-4"
                messageClassName="col-span-6"
            />

            <div className="flex justify-end items-center mt-2">
                <Button size="sm" type="submit">
                    {t.ChangePasswordButtonLabel}
                </Button>
            </div>
        </Form.Root>
    )
}
