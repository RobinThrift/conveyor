import { useStore } from "@tanstack/react-store"
import { useCallback, useEffect, useState } from "react"

import type { PlaintextPassword } from "@/auth"
import type { ChangePasswordArgs } from "@/ui/components/AuthForm"
import { actions, stores } from "@/ui/stores"

export interface SetupArgs {
    server: string
    username: string
    password: PlaintextPassword
}

export function useSyncSettingsTabState() {
    let status = useStore(stores.sync.status)
    let error = useStore(stores.sync.error)
    let info = useStore(stores.sync.info)

    let setup = useCallback((args: SetupArgs) => {
        actions.sync.setup(args)
    }, [])

    let [showSetup, setShowSetup] = useState<boolean>(info.isEnabled)

    let manualSync = useCallback(() => {
        actions.sync.syncStart()
    }, [])

    let manualFullDownload = useCallback(() => {
        actions.sync.syncStartDownloadFull()
    }, [])

    let manualFullUpload = useCallback(() => {
        actions.sync.syncStartUploadFull()
    }, [])

    let authError = useStore(stores.auth.error)
    let authStatus = useStore(stores.auth.status)
    let changePassword = useCallback((args: ChangePasswordArgs) => {
        actions.auth.changePassword(args)
    }, [])

    let [showPasswordChange, setShowPasswordChange] = useState<boolean>(info.isEnabled)

    useEffect(() => {
        setShowPasswordChange(info.isEnabled)
    }, [info.isEnabled])

    return {
        status,
        error,
        info,
        setup,
        showSetup,
        setShowSetup: useCallback(
            (value: boolean) => {
                if (!value && info.isEnabled) {
                    actions.sync.disable()
                }
                setShowSetup(value)
            },
            [info.isEnabled],
        ),
        showPasswordChange,
        manualSync,
        manualFullDownload,
        manualFullUpload,

        authStatus,
        authError,
        changePassword,
    }
}
