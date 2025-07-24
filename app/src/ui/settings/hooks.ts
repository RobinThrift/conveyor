import { useStore } from "@tanstack/react-store"
import { useMemo } from "react"

import type { Settings } from "@/domain/Settings"
import type { KeyPaths, ValueAt } from "@/lib/getset"
import { actions, selectors, stores } from "@/ui/stores"

export function useSetting<K extends KeyPaths<Settings>>(
    keypath: K,
): [ValueAt<Settings, K>, (v: ValueAt<Settings, K>) => void] {
    let value = useStore(stores.settings.values, selectors.settings.value(keypath))
    return useMemo(() => [value, (v) => actions.settings.set(keypath, v)], [keypath, value])
}

export function useTheme() {
    return useStore(stores.settings.values, (values) => ({
        mode: selectors.settings.mode(values),
        colourScheme: selectors.settings.colourScheme(values),
    }))
}
