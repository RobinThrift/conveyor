import { type StoreKeys, useStore } from "@nanostores/react"
import { useMemo } from "react"
import { settingsStore } from "./remote/settings"

export * from "./remote/settings"

type Keys = StoreKeys<typeof settingsStore.$values>

export function useSetting<T, K extends Keys>(
    key: K,
): [T, typeof settingsStore.set] {
    let parts = useMemo(() => key.split("."), [key])
    let keys = useMemo(() => {
        let paths = [] as Keys[]
        parts.forEach((p) =>
            paths.length === 0
                ? paths.push(p as Keys)
                : paths.push(`${paths[paths.length - 1]}.${p}` as Keys),
        )

        return paths
    }, [parts])
    let store = useStore(settingsStore.$values, { keys })

    return [
        useMemo(() => {
            let value = store as any

            parts.forEach((p) => {
                value = value[p]
            })

            return value as T
        }, [store, parts]),
        settingsStore.set,
    ]
}

export function useThemeMode() {
    let [mode] = useSetting("theme.mode")

    if (mode === "auto") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
    }

    return mode
}
