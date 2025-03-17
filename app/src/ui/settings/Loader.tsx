import React, { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import { Loader } from "@/ui/components/Loader"
import { actions, selectors } from "@/ui/state"

export function SettingsLoader({ children }: React.PropsWithChildren) {
    let isSetup = useSelector(selectors.setup.isSetup)
    let isLoading = useSelector(selectors.settings.isLoading)
    let isLoaded = useSelector(selectors.settings.isLoaded)
    let error = useSelector(selectors.settings.error)
    let dispatch = useDispatch()

    useEffect(() => {
        if (error) {
            // @TODO: better error reporting
            console.error("settings load error", error)
            return
        }

        if (isLoaded || isLoading || error) {
            return
        }

        dispatch(actions.settings.loadStart())
    }, [isLoaded, isLoading, error, dispatch])

    if (!isSetup) {
        return children
    }

    if (isLoading) {
        return <Loader />
    }

    return children
}
