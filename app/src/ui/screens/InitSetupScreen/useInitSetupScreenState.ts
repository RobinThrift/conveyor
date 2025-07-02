import { useCallback, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import { AgePrivateCryptoKey, type Identity } from "@/external/age/AgeCrypto"
import type { PlaintextPrivateKey } from "@/lib/crypto"
import { type AsyncResult, Err, fromThrowing } from "@/lib/result"
import type { ChangePasswordArgs, LoginArgs } from "@/ui/components/AuthForm"
import { type SyncMethod, actions, selectors } from "@/ui/state"

export function useInitSetupScreenState() {
    let dispatch = useDispatch()
    let step = useSelector(selectors.setup.step)
    let isNew = useSelector(selectors.setup.isNew)
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
            dispatch(actions.setup.setSetupOption({ key: "syncMethod", value: m }))
        },
        [dispatch],
    )

    let generatePrivateCryptoKey = useCallback(async (): AsyncResult<string> => {
        let [key, err] = await AgePrivateCryptoKey.generate()
        if (err) {
            return Err(err)
        }

        return await key.exportPrivateKey()
    }, [])

    let importPrivateCryptoKey = useCallback(
        (key: string) => {
            dispatch(
                actions.setup.setupCandidatePrivateCryptoKey({
                    plaintextKeyData: new AgePrivateCryptoKey(key as Identity)
                        .data as string as PlaintextPrivateKey,
                }),
            )
        },
        [dispatch],
    )

    let checkPrivateCryptoKey = useCallback((key: string) => {
        return fromThrowing(() => new AgePrivateCryptoKey(key as Identity) as any)
    }, [])

    return {
        step,
        isNew,
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

export function useStepConfigureRemoteSyncState({ next }: { next: () => void }) {
    let dispatch = useDispatch()

    let authError = useSelector(selectors.auth.error)
    let authStatus = useSelector(selectors.auth.status)
    let syncStatus = useSelector(selectors.sync.status)

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
        if (syncStatus === "ready") {
            next()
        }
    }, [next, syncStatus])

    return {
        authError,
        authStatus,
        login,
        changePassword,
    }
}
