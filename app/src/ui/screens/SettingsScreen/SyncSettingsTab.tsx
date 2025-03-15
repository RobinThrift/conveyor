import React from "react"

import type { SyncInfo } from "@/domain/SyncInfo"
import { Alert } from "@/ui/components/Alert"
import { AlertDialog } from "@/ui/components/AlertDialog"
import {
    AuthForm,
    type ChangePasswordArgs,
    ChangePasswordForm,
} from "@/ui/components/AuthForm"
import { Button } from "@/ui/components/Button"
import { DateTime } from "@/ui/components/DateTime"
import { WarningIcon } from "@/ui/components/Icons"
import { Checkbox } from "@/ui/components/Input/Checkbox"
import { Loader } from "@/ui/components/Loader"
import { useT } from "@/ui/i18n"
import type { AuthStatus } from "@/ui/state"

import {
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
            showPasswordChange,
            manualSync,
            manualFullDownload,
            manualFullUpload,
            authStatus,
            authError,
            changePassword,
        } = useSyncSettingsTabState()

        return (
            <div
                ref={forwardedRef}
                className="settings-section-content relative"
            >
                <div className="settings-sub-section">
                    <Checkbox
                        label={t.IsEnabled}
                        name="is_enabled"
                        value={showSetup}
                        onChange={(checked) => setShowSetup(checked as boolean)}
                    />
                </div>

                {info.isEnabled && (
                    <SectionSyncInfo
                        manualSync={manualSync}
                        manualFullDownload={manualFullDownload}
                        manualFullUpload={manualFullUpload}
                        isLoading={status === "syncing"}
                        error={error}
                        info={info}
                    />
                )}

                {showSetup && (
                    <SectionSetupSync
                        setup={setup}
                        authStatus={authStatus}
                        authError={authError}
                        changePassword={changePassword}
                    />
                )}

                {showPasswordChange && info.isEnabled && (
                    <SectionChangePassword
                        status={authStatus}
                        error={authError}
                        username={info.username}
                        changePassword={changePassword}
                    />
                )}

                {(status === "syncing" || status === "setting-up") && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/40 z-10">
                        <Loader />
                    </div>
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
    authStatus,
    authError,
    changePassword,
}: {
    authStatus: AuthStatus
    setup: (args: SetupArgs) => void
    authError?: Error
    changePassword: (args: ChangePasswordArgs) => void
}) {
    return (
        <AuthForm
            className="settings-sub-section"
            login={setup}
            changePassword={changePassword}
            status={authStatus}
            error={authError}
        />
    )
}

function SectionChangePassword({
    status,
    error,
    username,
    changePassword,
}: {
    status: AuthStatus
    error?: Error
    username: string
    changePassword: (creds: ChangePasswordArgs) => void
}) {
    return (
        <ChangePasswordForm
            className="settings-sub-section"
            username={username}
            status={status}
            error={error}
            changePassword={changePassword}
        />
    )
}
