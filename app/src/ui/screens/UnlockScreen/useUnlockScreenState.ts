import { useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { PlaintextPrivateKey } from "@/lib/crypto"
import { actions, selectors } from "@/ui/state"

export function useUnlockScreenState() {
    let dispatch = useDispatch()
    let error = useSelector(selectors.unlock.error)
    let unlockState = useSelector(selectors.unlock.state)
    let isDisabled = unlockState !== "locked"

    let unlock = useCallback(
        ({
            plaintextKeyData,
            storeKey,
        }: { plaintextKeyData: PlaintextPrivateKey; storeKey: boolean }) => {
            dispatch(actions.unlock.unlock({ plaintextKeyData, storeKey }))
        },
        [dispatch],
    )

    return {
        unlock,
        unlockState,
        isDisabled,
        error,
    }
}
