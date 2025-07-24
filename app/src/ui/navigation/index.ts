import { useStore } from "@tanstack/react-store"
import { createContext, useCallback, useContext } from "react"

import type {
    NavigationController,
    Params,
    Restore,
    Screens,
    Stacks,
} from "@/control/NavigationController"
import { stores } from "@/ui/stores"

const navContext = createContext<NavigationController | undefined>(undefined)

export const NavigationProvider = navContext.Provider

export function useNavigation(): {
    push: (name: keyof Screens, params: Params, restore: Restore, stack?: Stacks) => void
    pop: () => void
    popStack: () => Promise<void>
    updateParams: (params: Partial<Params>) => void
} {
    let navCtrl = useContext(navContext)
    return {
        push: useCallback(
            (name: keyof Screens, params: Params, restore: Restore, stack?: Stacks) => {
                navCtrl?.push({ screen: { name, params }, stack, restore })
            },
            [navCtrl],
        ),
        pop: useCallback(() => navCtrl?.pop(), [navCtrl]),
        popStack: useCallback(() => navCtrl?.popStack() ?? Promise.resolve(), [navCtrl]),
        updateParams: useCallback(
            (params: Partial<Params>) => {
                navCtrl?.updateParams(params)
            },
            [navCtrl],
        ),
    }
}

export function useCurrentPage(): {
    name: keyof Screens
    params: Screens[keyof Screens]
    restore: Partial<Restore>
} {
    return useStore(stores.navigation.currentPage, (s) => ({
        name: s.screen.name,
        params: s.screen.params,
        restore: s.restore,
    }))
}
