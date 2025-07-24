import { useStore } from "@tanstack/react-store"
import { useCallback, useEffect } from "react"

import { AgePrivateCryptoKey, type Identity } from "@/external/age/AgeCrypto"
import type { PlaintextPrivateKey } from "@/lib/crypto"
import { type AsyncResult, Err, fromThrowing } from "@/lib/result"
import type { ChangePasswordArgs, LoginArgs } from "@/ui/components/AuthForm"
import { actions, selectors, stores } from "@/ui/stores"
import type { SyncMethod } from "@/ui/stores/setup"

export function useInitSetupScreenState() {
    let step = useStore(stores.setup.step)
    let isNew = useStore(stores.setup.selectedOptions, selectors.setup.isNew)
    let error = useStore(stores.setup.error)
    let selectedOptions = useStore(stores.setup.selectedOptions)

    let next = useCallback(() => {
        actions.setup.next()
    }, [])

    let back = useCallback(() => {
        actions.setup.setStep("initial-setup")
    }, [])

    let startNew = useCallback(() => {
        actions.setup.startNew()
    }, [])

    let startFromRemote = useCallback(() => {
        actions.setup.startFromRemote()
    }, [])

    let setSyncMethod = useCallback((m: SyncMethod) => {
        actions.setup.setSetupOption("syncMethod", m)
    }, [])

    let generatePrivateCryptoKey = useCallback(async (): AsyncResult<string> => {
        let [key, err] = await AgePrivateCryptoKey.generate()
        if (err) {
            return Err(err)
        }

        return await key.exportPrivateKey()
    }, [])

    let importPrivateCryptoKey = useCallback((key: string) => {
        actions.setup.setupCandidatePrivateCryptoKey(
            new AgePrivateCryptoKey(key as Identity).data as string as PlaintextPrivateKey,
        )
    }, [])

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
    let authError = useStore(stores.auth.error)
    let authStatus = useStore(stores.auth.status)
    let syncStatus = useStore(stores.sync.status)

    let login = useCallback((args: LoginArgs) => {
        actions.sync.setup(args)
    }, [])

    let changePassword = useCallback((args: ChangePasswordArgs) => {
        actions.auth.changePassword(args)
    }, [])

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
