/** biome-ignore-all lint/correctness/useUniqueElementIds: is guaranteed to be unique */

import clsx from "clsx"
import React, { useCallback, useId, useMemo, useState } from "react"

import type { SyncInfo } from "@/domain/SyncInfo"
import { Alert } from "@/ui/components/Alert"
import { AlertDialog } from "@/ui/components/AlertDialog"
import { AuthForm, type ChangePasswordArgs, ChangePasswordForm } from "@/ui/components/AuthForm"
import { Button } from "@/ui/components/Button"
import { DateTime } from "@/ui/components/DateTime"
import {
    ArrowsClockwiseIcon,
    CaretDownIcon,
    CloudArrowDownIcon,
    CloudArrowUpIcon,
    WarningIcon,
} from "@/ui/components/Icons"
import { Checkbox } from "@/ui/components/Input/Checkbox"
import { Loader } from "@/ui/components/Loader"
import { useT } from "@/ui/i18n"
import type { AuthStatus } from "@/ui/stores/auth"

import { type SetupArgs, useSyncSettingsTabState } from "./useSyncSettingsTabState"

export function SyncSettingsTab() {
    let t = useT("screens/Settings/SyncSettings")
    let tInfo = useT("screens/Settings/SyncSettings/Info")
    let tSetup = useT("screens/Settings/SyncSettings/Setup")
    let tChangePassword = useT("screens/Settings/SyncSettings/ChangePassword")
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

    let { expanded, setExpanded, itemIDs } = useSyncSettingsTabDisclosureGroup([
        "setup",
        "change-password",
    ])

    return (
        <>
            <header>
                <h2>{t.Title}</h2>
                <small className="settings-tab-description">{t.Description}</small>
            </header>

            <div className="settings-section">
                <Checkbox
                    label={tInfo.IsEnabled}
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
                <div className="settings-disclosure-group">
                    <div id="setup" className="settings-disclosure-group-item">
                        <header className="settings-section-header">
                            <button
                                className="settings-disclosure-group-toggle"
                                type="button"
                                aria-controls={itemIDs[0]}
                                aria-expanded={expanded === itemIDs[0]}
                                onClick={() => setExpanded(itemIDs[0])}
                            >
                                <CaretDownIcon className="icon" aria-hidden={true} />
                                {tSetup.Title}
                            </button>
                        </header>
                        <div
                            id={itemIDs[0]}
                            className="settings-disclosure-group-panel"
                            inert={expanded !== itemIDs[0]}
                        >
                            <SectionSetupSync
                                setup={setup}
                                authStatus={authStatus}
                                authError={authError}
                                changePassword={changePassword}
                            />
                        </div>
                    </div>

                    {showPasswordChange && info.isEnabled && (
                        <div id="change-password" className="settings-disclosure-group-item">
                            <header className="settings-section-header">
                                <button
                                    className="settings-disclosure-group-toggle"
                                    type="button"
                                    aria-controls={itemIDs[1]}
                                    aria-expanded={expanded === itemIDs[1]}
                                    onClick={() => setExpanded(itemIDs[1])}
                                >
                                    <CaretDownIcon className="icon" aria-hidden={true} />
                                    {tChangePassword.Title}
                                </button>
                            </header>
                            <div
                                id={itemIDs[0]}
                                className="settings-disclosure-group-panel"
                                inert={expanded !== itemIDs[1]}
                            >
                                <SectionChangePassword
                                    status={authStatus}
                                    error={authError}
                                    username={info.username}
                                    changePassword={changePassword}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!info.isEnabled && status === "error" && error ? (
                <Alert>
                    {error.name}: {error.message}
                    {error.stack && (
                        <pre>
                            <code>{error.stack}</code>
                        </pre>
                    )}
                </Alert>
            ) : undefined}

            {(status === "syncing" || status === "setting-up") && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/40 z-10">
                    <Loader />
                </div>
            )}
        </>
    )
}

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
        <div
            className={clsx("settings-section space-y-4", {
                "is-syncing": isLoading,
            })}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-level-1/50 z-10">
                    <Loader />
                </div>
            )}

            {error && (
                <Alert>
                    {error.name}: {error.message}
                    {error.stack && (
                        <pre>
                            <code>{error.stack}</code>
                        </pre>
                    )}
                </Alert>
            )}

            {info.isEnabled && (
                <>
                    <dl className="tablet:grid grid-cols-2 text-sm tablet:text-md">
                        <dt className="font-semibold">{t.ClientID}</dt>
                        <dd>{info.clientID}</dd>
                        <dt className="font-semibold">{t.LastSyncAt}</dt>
                        <dd>
                            {info.lastSyncedAt ? (
                                <DateTime relative date={info.lastSyncedAt} />
                            ) : (
                                t.LastSyncedNever
                            )}
                        </dd>
                    </dl>

                    <div className="flex flex-col tablet:flex-col gap-2">
                        <Button
                            variant="primary"
                            disabled={isLoading}
                            onClick={manualSync}
                            iconLeft={<ArrowsClockwiseIcon />}
                        >
                            {t.ManualSyncButtonLabel}
                        </Button>

                        <AlertDialog>
                            <AlertDialog.Trigger
                                variant="danger"
                                disabled={isLoading}
                                iconLeft={<CloudArrowUpIcon />}
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
                                    <Button variant="danger" onClick={manualFullUpload}>
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
                                iconRight={<CloudArrowDownIcon />}
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
                                    <Button variant="danger" onClick={manualFullDownload}>
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
            className="settings-section"
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
            className="settings-section"
            username={username}
            status={status}
            error={error}
            changePassword={changePassword}
        />
    )
}

function useSyncSettingsTabDisclosureGroup(items: string[]) {
    let baseID = useId()
    let itemIDs = useMemo(() => {
        let ids = []
        for (let i = 0; i <= items.length; i++) {
            ids.push(`${baseID}-${items[i]}`)
        }

        return ids
    }, [baseID, items])

    let [expanded, _setExpanded] = useState<string | undefined>(itemIDs[0] ?? undefined)

    let setExpanded = useCallback((item: string) => {
        _setExpanded((expanded) => (expanded === item ? undefined : item))
    }, [])

    return {
        itemIDs,
        expanded,
        setExpanded,
    }
}
