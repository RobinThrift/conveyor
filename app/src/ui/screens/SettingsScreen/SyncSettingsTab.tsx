import React, { useCallback } from "react"

import type { SyncInfo } from "@/domain/SyncInfo"
import { Alert } from "@/ui/components/Alert"
import { AlertDialog } from "@/ui/components/AlertDialog"
import { Button } from "@/ui/components/Button"
import { DateTime } from "@/ui/components/DateTime"
import * as Form from "@/ui/components/Form"
import { WarningIcon } from "@/ui/components/Icons"
import { Input } from "@/ui/components/Input"
import { Checkbox } from "@/ui/components/Input/Checkbox"
import { Loader } from "@/ui/components/Loader"
import { useT } from "@/ui/i18n"

import {
    type ChangePasswordCreds,
    type SetupArgs,
    useSyncSettingsTabState,
} from "./useSyncSettingsTabState"

export const SyncSettingsTab = React.forwardRef<HTMLDivElement>(
    function SyncSettingsTab(_, forwardedRef) {
        let t = useT("screens/Settings/SyncSettings/Info")
        let {
            status,
            info,
            error,
            setup,
            showSetup,
            setShowSetup,
            manualSync,
            manualFullDownload,
            manualFullUpload,
            authIsLoading,
            authError,
            changePassword,
        } = useSyncSettingsTabState()

        return (
            <div ref={forwardedRef} className="settings-section-content">
                <div className="settings-sub-section">
                    <Checkbox
                        label={t.IsEnabled}
                        name="is_enabled"
                        value={showSetup}
                        onChange={(checked) => setShowSetup(checked as boolean)}
                    />
                </div>

                {showSetup && (
                    <SectionSetupSync
                        setup={setup}
                        isLoading={status === "setting-up" || authIsLoading}
                        error={error || authError}
                    />
                )}

                {info.isEnabled && (
                    <SectionSyncInfo
                        manualSync={manualSync}
                        manualFullDownload={manualFullDownload}
                        manualFullUpload={manualFullUpload}
                        isLoading={status === "setting-up" || authIsLoading}
                        error={error}
                        info={info}
                    />
                )}

                {info.isEnabled && (
                    <SectionChangePassword
                        isLoading={authIsLoading}
                        error={authError}
                        username={info.username}
                        changePassword={changePassword}
                    />
                )}
            </div>
        )
    },
)

function SectionSyncInfo({
    manualSync,
    manualFullDownload,
    manualFullUpload,
    info,
    isLoading,
    error,
}: {
    manualSync: () => void
    manualFullDownload: () => void
    manualFullUpload: () => void
    info: SyncInfo
    isLoading: boolean
    error?: Error
}) {
    let t = useT("screens/Settings/SyncSettings/Info")
    return (
        <div className="settings-sub-section space-y-4 relative">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/40 z-10">
                    <Loader />
                </div>
            )}

            {error && (
                <Alert variant="danger">
                    {error.name}: {error.message}
                </Alert>
            )}

            {info.isEnabled && (
                <>
                    <dl className="grid grid-cols-2">
                        <dt>{t.ClientID}</dt>
                        <dd>{info.clientID}</dd>
                        <dt>{t.LastSyncAt}</dt>
                        <dd>
                            {info.lastSyncedAt ? (
                                <DateTime relative date={info.lastSyncedAt} />
                            ) : (
                                t.LastSyncedNever
                            )}
                        </dd>
                    </dl>

                    <div className="flex gap-2">
                        <Button
                            variant="primary"
                            disabled={isLoading}
                            size="sm"
                            onClick={manualSync}
                        >
                            {t.ManualSyncButtonLabel}
                        </Button>

                        <AlertDialog>
                            <AlertDialog.Trigger
                                variant="danger"
                                disabled={isLoading}
                                size="sm"
                            >
                                {t.ManualFullUploadButtonLabel}
                            </AlertDialog.Trigger>

                            <AlertDialog.Content key="content">
                                <AlertDialog.Title>
                                    {t.ManualFullUploadButtonLabel}
                                </AlertDialog.Title>

                                <AlertDialog.Icon>
                                    <WarningIcon className="text-danger" />
                                </AlertDialog.Icon>

                                <AlertDialog.Description>
                                    {t.ManualFullUploadWarning}
                                </AlertDialog.Description>

                                <AlertDialog.Buttons>
                                    <Button
                                        variant="danger"
                                        onClick={manualFullUpload}
                                    >
                                        {t.ManualFullUploadButtonLabel}
                                    </Button>
                                    <AlertDialog.CancelButton />
                                </AlertDialog.Buttons>
                            </AlertDialog.Content>
                        </AlertDialog>

                        <AlertDialog>
                            <AlertDialog.Trigger
                                variant="danger"
                                disabled={isLoading}
                                size="sm"
                            >
                                {t.ManualFullDownloadButtonLabel}
                            </AlertDialog.Trigger>

                            <AlertDialog.Content key="content">
                                <AlertDialog.Title>
                                    {t.ManualFullDownloadButtonLabel}
                                </AlertDialog.Title>

                                <AlertDialog.Icon>
                                    <WarningIcon className="text-danger" />
                                </AlertDialog.Icon>

                                <AlertDialog.Description>
                                    {t.ManualFullDownloadWarning}
                                </AlertDialog.Description>

                                <AlertDialog.Buttons>
                                    <Button
                                        variant="danger"
                                        onClick={manualFullDownload}
                                    >
                                        {t.ManualFullDownloadButtonLabel}
                                    </Button>
                                    <AlertDialog.CancelButton />
                                </AlertDialog.Buttons>
                            </AlertDialog.Content>
                        </AlertDialog>
                    </div>
                </>
            )}
        </div>
    )
}

function SectionSetupSync({
    setup,
    isLoading,
    error,
}: { setup: (args: SetupArgs) => void; isLoading: boolean; error?: Error }) {
    let t = useT("screens/Settings/SyncSettings/Setup")

    let onSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            e.stopPropagation()

            let target = e.target as HTMLFormElement

            let server = target.querySelector("#server") as HTMLInputElement
            let username = target.querySelector("#username") as HTMLInputElement
            let password = target.querySelector("#password") as HTMLInputElement

            setup({
                serverAddr:
                    server.value ||
                    `${globalThis.location.protocol}//${globalThis.location.host}`,
                username: username.value,
                password: password.value,
            })
        },
        [setup],
    )

    return (
        <Form.Root
            className="settings-sub-section space-y-4 relative"
            action="#"
            method="post"
            onSubmit={onSubmit}
        >
            <h3>{t.Title}</h3>

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
                disabled={isLoading}
            />

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
                disabled={isLoading}
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
                disabled={isLoading}
            />

            <div className="flex justify-end items-center mt-2">
                <Button variant="primary" type="submit" disabled={isLoading}>
                    {t.SetupButtonLabel}
                </Button>
            </div>

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/40 z-10">
                    <Loader />
                </div>
            )}

            {error && (
                <Alert variant="danger">
                    {error.name}: {error.message}
                </Alert>
            )}
        </Form.Root>
    )
}

function SectionChangePassword({
    isLoading,
    error,
    username,
    changePassword,
}: {
    isLoading: boolean
    error?: Error
    username: string
    changePassword: (creds: ChangePasswordCreds) => void
}) {
    let t = useT("screens/Settings/SyncSettings/ChangePassword")

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

            changePassword({
                username: username,
                currentPassword: currentPassword.value,
                newPassword: newPassword.value,
                newPasswordRepeat: newPasswordRepeat.value,
            })
        },
        [username, changePassword],
    )

    return (
        <Form.Root
            className="settings-sub-section space-y-4 relative"
            action="#"
            method="post"
            onSubmit={onSubmit}
        >
            <h3>{t.Title}</h3>

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
                <Button size="sm" type="submit" disabled={isLoading}>
                    {t.ChangePasswordButtonLabel}
                </Button>
            </div>

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/40 z-10">
                    <Loader />
                </div>
            )}

            {error && (
                <Alert variant="danger">
                    {error.name}: {error.message}
                </Alert>
            )}
        </Form.Root>
    )
}
