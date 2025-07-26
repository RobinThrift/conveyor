import { useStore } from "@tanstack/react-store"
import { useCallback } from "react"
import type { PlaintextPrivateKey } from "@/lib/crypto"
import { actions, stores } from "@/ui/stores"

export function useUnlockScreenState() {
    let unlockState = useStore(stores.unlock.status)
    let error = useStore(stores.unlock.error)
    let isDisabled = unlockState !== "locked"

    let unlock = useCallback(
        ({
            plaintextKeyData,
            storeKey,
        }: {
            plaintextKeyData: PlaintextPrivateKey
            storeKey: boolean
        }) => {
            actions.unlock.unlock({ plaintextKeyData, storeKey })
        },
        [],
    )

    return {
        unlock,
        unlockState,
        isDisabled,
        error,
    }
}
