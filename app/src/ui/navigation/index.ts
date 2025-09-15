import { useStore } from "@tanstack/react-store"
import { createContext, useCallback, useContext } from "react"

import type { NavigationController, Params, Restore, Screens } from "@/control/NavigationController"
import { stores } from "@/ui/stores"

const navContext = createContext<NavigationController | undefined>(undefined)

export const NavigationProvider = navContext.Provider

export function useNavigation(): {
    push: (screen: keyof Screens, params: Params[keyof Screens], restore: Restore) => void
    pop: () => void
    popStack: () => Promise<void>
    updateParams: (params: Partial<Params[keyof Screens]>) => void
} {
    let navCtrl = useContext(navContext)
    return {
        push: useCallback(
            (screen, params, restore) => {
                navCtrl?.push({ screen, params, restore })
            },
            [navCtrl],
        ),
        pop: useCallback(() => navCtrl?.pop(), [navCtrl]),
        popStack: useCallback(() => navCtrl?.popStack() ?? Promise.resolve(), [navCtrl]),
        updateParams: useCallback(
            (params: Partial<Params[keyof Screens]>) => {
                navCtrl?.updateParams(params)
            },
            [navCtrl],
        ),
    }
}

export function useCurrentPage(): {
    name: keyof Screens
    params: Params[keyof Screens]
    restore: Partial<Restore>
} {
    return useStore(stores.navigation.currentPage, (s) => ({
        name: s.screen,
        params: s.params,
        restore: s.restore,
    }))
}
