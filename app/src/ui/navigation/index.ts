import { useStore } from "@tanstack/react-store"
import { createContext, useCallback, useContext } from "react"

import type { NavigationController, Params, Screens } from "@/control/NavigationController"
import type { NavgationState } from "@/lib/navigation"
import { stores } from "@/ui/stores"

const navContext = createContext<NavigationController | undefined>(undefined)

export const NavigationProvider = navContext.Provider

export function useNavigation(): {
    push: (screen: keyof Screens, params: Params[keyof Screens]) => void
    pop: () => void
} {
    let navCtrl = useContext(navContext)
    return {
        push: useCallback(
            (screen, params) => {
                navCtrl?.push({ screen, params })
            },
            [navCtrl],
        ),
        pop: useCallback(() => navCtrl?.pop(), [navCtrl]),
    }
}

export function useCurrentScreen(): NavgationState<Screens> {
    return useStore(stores.navigation.currentScreen)
}

export function getScrollOffsetTop() {
    return Math.ceil(window.visualViewport?.pageTop ?? window.scrollY)
}
