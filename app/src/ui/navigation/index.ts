import { createContext, useCallback, useContext } from "react"
import { useSelector } from "react-redux"

import type {
    NavigationController,
    Params,
    Restore,
    Screens,
    Stacks,
} from "@/control/NavigationController"
import { selectors } from "@/ui/state"
import { createSelector } from "@reduxjs/toolkit"

const navContext = createContext<NavigationController | undefined>(undefined)

export const NavigationProvider = navContext.Provider

export function useNavigation(): {
    push: (
        name: keyof Screens,
        params: Params,
        restore: Restore,
        stack?: Stacks,
    ) => void
    pop: () => void
    popStack: () => Promise<void>
    updateParams: (params: Partial<Params>) => void
} {
    let navCtrl = useContext(navContext)
    return {
        push: useCallback(
            (
                name: keyof Screens,
                params: Params,
                restore: Restore,
                stack?: Stacks,
            ) => {
                navCtrl?.push({ screen: { name, params }, stack, restore })
            },
            [navCtrl],
        ),
        pop: useCallback(() => navCtrl?.pop(), [navCtrl]),
        popStack: useCallback(
            () => navCtrl?.popStack() ?? Promise.resolve(),
            [navCtrl],
        ),
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

const prevPageSelector = createSelector(
    [
        selectors.navigation.prevName,
        selectors.navigation.prevParams,
        selectors.navigation.prevRestore,
    ],
    (name, params, restore) =>
        name && params && restore
            ? {
                  name,
                  params,
                  restore,
              }
            : undefined,
)

export function usePreviousPage():
    | {
          name: keyof Screens
          params: Screens[keyof Screens]
          restore: Partial<Restore>
      }
    | undefined {
    return useSelector(prevPageSelector)
}
