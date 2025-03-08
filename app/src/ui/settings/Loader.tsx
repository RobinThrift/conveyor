import React, { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import { Loader } from "@/ui/components/Loader"
import { actions, selectors } from "@/ui/state"

export function SettingsLoader({ children }: React.PropsWithChildren) {
    let isLoading = useSelector(selectors.settings.isLoading)
    let isLoaded = useSelector(selectors.settings.isLoaded)
    let dispatch = useDispatch()

    useEffect(() => {
        if (isLoaded || isLoading) {
            return
        }

        dispatch(actions.settings.loadStart())
    }, [isLoaded, isLoading, dispatch])

    if (isLoading) {
        return <Loader />
    }

    return children
}
