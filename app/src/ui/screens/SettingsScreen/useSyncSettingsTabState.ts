import type { PlaintextPassword } from "@/auth"
import { useCallback, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import { actions } from "@/ui/state"
import { selectors } from "@/ui/state/selectors"

export interface SetupArgs {
    serverAddr: string
    username: string
    password: PlaintextPassword
}

export interface ChangePasswordCreds {
    username: string
    currentPassword: PlaintextPassword
    newPassword: PlaintextPassword
    newPasswordRepeat: PlaintextPassword
}

export function useSyncSettingsTabState() {
    let dispatch = useDispatch()

    let status = useSelector(selectors.sync.status)
    let error = useSelector(selectors.sync.error)
    let info = useSelector(selectors.sync.info)

    let setup = useCallback(
        (args: SetupArgs) => {
            dispatch(actions.sync.setup(args))
        },
        [dispatch],
    )

    let [showSetup, setShowSetup] = useState<boolean>(info.isEnabled)

    let manualSync = useCallback(() => {
        dispatch(actions.sync.syncStart())
    }, [dispatch])

    let manualFullDownload = useCallback(() => {
        dispatch(actions.sync.syncStartDownloadFull())
    }, [dispatch])

    let manualFullUpload = useCallback(() => {
        dispatch(actions.sync.syncStartUploadFull())
    }, [dispatch])

    let authError = useSelector(selectors.auth.error)
    let authIsLoading = useSelector(selectors.auth.isLoading)
    let changePassword = useCallback(
        (creds: ChangePasswordCreds) => {
            dispatch(actions.auth.changePassword(creds))
        },
        [dispatch],
    )

    return {
        status,
        error,
        info,
        setup,
        showSetup,
        setShowSetup,
        manualSync,
        manualFullDownload,
        manualFullUpload,

        authIsLoading,
        authError,
        changePassword,
    }
}
