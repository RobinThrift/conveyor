import { useStore } from "@tanstack/react-store"
import React, { useEffect } from "react"

import { Loader } from "@/ui/components/Loader"
import { actions, selectors, stores } from "@/ui/stores"

export function SettingsLoader({ children }: React.PropsWithChildren) {
    let isSetup = useStore(stores.setup.isSetup)
    let isUnlocked = useStore(stores.unlock.status, selectors.unlock.isUnlocked)
    let isLoading = useStore(
        stores.settings.state,
        (s) => s.state === "loading" || s.state === "load-requested",
    )
    let isLoaded = useStore(stores.settings.state, (s) => s.state === "done")
    let error = useStore(stores.settings.state, (s) => (s.state === "error" ? s.error : undefined))

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

        actions.settings.load()
    }, [isSetup, isUnlocked, isLoaded, isLoading, error])

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
