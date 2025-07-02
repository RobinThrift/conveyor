import type { PlaintextPassword } from "@/auth"
import { useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { ChangePasswordArgs } from "@/ui/components/AuthForm"
import { actions } from "@/ui/state"
import { selectors } from "@/ui/state/selectors"

export interface SetupArgs {
    server: string
    username: string
    password: PlaintextPassword
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
    let authStatus = useSelector(selectors.auth.status)
    let changePassword = useCallback(
        (args: ChangePasswordArgs) => {
            dispatch(actions.auth.changePassword(args))
        },
        [dispatch],
    )

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
                    dispatch(actions.sync.disable())
                }
                setShowSetup(value)
            },
            [dispatch, info.isEnabled],
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
