import { createContext, useCallback, useContext } from "react"
import { useSelector } from "react-redux"

import type {
    NavigationController,
    Params,
    Restore,
    Screens,
} from "@/control/NavigationController"
import { selectors } from "@/ui/state"
import { createSelector } from "@reduxjs/toolkit"

const navContext = createContext<NavigationController | undefined>(undefined)

export const NavigationProvider = navContext.Provider

export function useNavigation(): {
    push: (name: keyof Screens, params: Params, restore: Restore) => void
    pop: () => void
    updateParams: (params: Partial<Params>) => void
} {
    let navCtrl = useContext(navContext)
    return {
        push: useCallback(
            (name: keyof Screens, params: Params, restore: Restore) => {
                navCtrl?.push({ screen: { name, params }, restore })
            },
            [navCtrl],
        ),
        pop: useCallback(() => navCtrl?.pop(), [navCtrl]),
        updateParams: useCallback(
            (params: Partial<Params>) => {
                navCtrl?.updateParams(params)
            },
            [navCtrl],
        ),
    }
}

const currentPageSelector = createSelector(
    [
        selectors.navigation.currentName,
        selectors.navigation.currentParams,
        selectors.navigation.currentRestore,
    ],
    (name, params, restore) => ({
        name,
        params,
        restore,
    }),
)

export function useCurrentPage(): {
    name: keyof Screens
    params: Screens[keyof Screens]
    restore: Partial<Restore>
} {
    return useSelector(currentPageSelector)
}
