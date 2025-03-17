import { useCallback, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { PlaintextPrivateKey } from "@/lib/crypto"
import { actions, selectors } from "@/ui/state"

export function useUnlockScreenState() {
    let dispatch = useDispatch()
    let isUnlocked = useSelector(selectors.unlock.isUnlocked)
    let error = useSelector(selectors.unlock.error)

    let unlock = useCallback(
        ({
            plaintextKeyData,
            storeKey,
        }: { plaintextKeyData: PlaintextPrivateKey; storeKey: boolean }) => {
            dispatch(actions.unlock.unlock({ plaintextKeyData, storeKey }))
        },
        [dispatch],
    )

    useEffect(() => {
        if (isUnlocked) {
            dispatch(actions.router.goto({ path: "/" }))
        }
    }, [isUnlocked, dispatch])

    return {
        unlock,
        error,
    }
}
