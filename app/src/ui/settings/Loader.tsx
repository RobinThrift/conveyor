import React, { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import { Loader } from "@/ui/components/Loader"
import { actions, selectors } from "@/ui/state"

export function SettingsLoader({ children }: React.PropsWithChildren) {
    let isSetup = useSelector(selectors.setup.isSetup)
    let isUnlocked = useSelector(selectors.unlock.isUnlocked)
    let isLoading = useSelector(selectors.settings.isLoading)
    let isLoaded = useSelector(selectors.settings.isLoaded)
    let error = useSelector(selectors.settings.error)
    let dispatch = useDispatch()

    useEffect(() => {
        if (!isSetup || !isUnlocked) {
            return
        }

        if (error) {
            // @TODO: better error reporting
            console.error("settings load error", error)
            return
        }

        if (isLoaded || isLoading || error) {
            return
        }

        dispatch(actions.settings.loadStart())
    }, [isSetup, isUnlocked, isLoaded, isLoading, error, dispatch])

    if (!isSetup || !isUnlocked) {
        return children
    }

    if (isLoading) {
        return (
            <>
                <div className="absolute z-30 inset-0 bg-primary flex items-center justify-center">
                    <Loader className="[--loader-color:var(--color-primary-contrast)]" />
                </div>
                {children}
            </>
        )
    }

    return children
}
