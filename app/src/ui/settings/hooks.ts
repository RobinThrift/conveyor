import { createSelector } from "@reduxjs/toolkit"
import { useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { Settings } from "@/domain/Settings"
import type { KeyPaths, ValueAt } from "@/lib/getset"
import { type RootState, actions, selectors } from "@/ui/state"

export function useSetting<K extends KeyPaths<Settings>>(
    keypath: K,
): [ValueAt<Settings, K>, (v: ValueAt<Settings, K>) => void] {
    let value = useSelector((state: RootState) =>
        selectors.settings.value(state, keypath),
    )
    let dispatch = useDispatch()
    return useMemo(
        () => [
            value,
            (v) =>
                dispatch(
                    actions.settings.set({ key: keypath, value: v as any }),
                ),
        ],
        [keypath, value, dispatch],
    )
}

const themeSelector = createSelector(
    [selectors.settings.mode, selectors.settings.colourScheme],
    (mode, colourScheme) => ({
        mode,
        colourScheme,
    }),
)

export function useTheme() {
    return useSelector(themeSelector)
}
