import React, { useCallback } from "react"

import type { Params, Screens } from "@/control/NavigationController"
import { useNavigation } from "@/ui/navigation"
import { stores } from "@/ui/stores"

export function Link<S extends keyof Screens>({
    screen,
    params,
    addParams,
    ...props
}: React.AnchorHTMLAttributes<any> & {
    ref?: React.Ref<HTMLAnchorElement>
    screen?: S
    params?: Params[S]
    addParams?: boolean
}) {
    let { push } = useNavigation()
    let onClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (screen) {
                e.preventDefault()
                let screenParams = params
                if (addParams) {
                    screenParams = {
                        ...stores.navigation.currentScreen.state.params,
                        ...params,
                    } as Params[S]
                }
                push(screen, screenParams || {})
            }
        },
        [screen, params, addParams, push],
    )

    return (
        // biome-ignore lint/a11y/useValidAnchor: for internal navigation
        // biome-ignore lint/a11y/noStaticElementInteractions: for internal navigation
        <a ref={props.ref} {...props} onClick={screen ? onClick : undefined} />
    )
}
