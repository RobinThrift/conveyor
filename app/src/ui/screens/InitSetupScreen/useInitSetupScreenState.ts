import { useCallback, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import { AgePrivateCryptoKey, type Identity } from "@/external/age/AgeCrypto"
import { type AsyncResult, fromThrowing } from "@/lib/result"
import type { ChangePasswordArgs, LoginArgs } from "@/ui/components/AuthForm"
import { type SyncMethod, actions, selectors } from "@/ui/state"

export function useInitSetupScreenState() {
    let dispatch = useDispatch()
    let step = useSelector(selectors.setup.step)
    let error = useSelector(selectors.setup.error)
    let selectedOptions = useSelector(selectors.setup.selectedOptions)

    let next = useCallback(() => {
        dispatch(actions.setup.next())
    }, [dispatch])

    let back = useCallback(() => {
        dispatch(actions.setup.setStep({ step: "initial-setup" }))
    }, [dispatch])

    let startNew = useCallback(() => {
        dispatch(actions.setup.startNew())
    }, [dispatch])

    let startFromRemote = useCallback(() => {
        dispatch(actions.setup.startFromRemote())
    }, [dispatch])

    let setSyncMethod = useCallback(
        (m: SyncMethod) => {
            dispatch(
                actions.setup.setSetupOption({ key: "syncMethod", value: m }),
            )
        },
        [dispatch],
    )

    let generatePrivateCryptoKey =
        useCallback(async (): AsyncResult<string> => {
            let key = await AgePrivateCryptoKey.generate()
            if (!key.ok) {
                return key
            }

            return await key.value.exportPrivateKey()
        }, [])

    let importPrivateCryptoKey = useCallback(
        (key: string) => {
            dispatch(
                actions.setup.setupCandidatePrivateCryptoKey({
                    key: new AgePrivateCryptoKey(key as Identity),
                }),
            )
        },
        [dispatch],
    )

    let checkPrivateCryptoKey = useCallback((key: string) => {
        return fromThrowing(
            () => new AgePrivateCryptoKey(key as Identity) as any,
        )
    }, [])

    return {
        step,
        error,
        next,
        back,
        startNew,
        startFromRemote,
        syncMethod: selectedOptions.syncMethod,
        setSyncMethod,
        generatePrivateCryptoKey,
        importPrivateCryptoKey,
        checkPrivateCryptoKey,
    }
}

export function useStepConfigureRemoteSyncState({
    next,
}: { next: () => void }) {
    let dispatch = useDispatch()

    let authError = useSelector(selectors.auth.error)
    let authStatus = useSelector(selectors.auth.status)

    let login = useCallback(
        (args: LoginArgs) => {
            dispatch(actions.sync.setup(args))
        },
        [dispatch],
    )

    let changePassword = useCallback(
        (args: ChangePasswordArgs) => {
            dispatch(actions.auth.changePassword(args))
        },
        [dispatch],
    )

    useEffect(() => {
        if (authStatus === "authenticated") {
            next()
        }
    }, [next, authStatus])

    return {
        authError,
        authStatus,
        login,
        changePassword,
    }
}
