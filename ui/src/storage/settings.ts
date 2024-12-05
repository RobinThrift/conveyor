import type { themes } from "@/themes"
import { type StoreKeys, useStore } from "@nanostores/react"
import { useMemo } from "react"
import { settingsStore } from "./remote/settings"

export * from "./remote/settings"

type Keys = StoreKeys<typeof settingsStore.$values>

export function useSetting<T, K extends Keys = Keys>(
    key: K,
): [T, (v: T) => void] {
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
        (v: T) => {
            settingsStore.set(key, v)
        },
    ]
}

export function useTheme<T extends keyof typeof themes>(): [
    T,
    "light" | "dark",
] {
    let [mode] = useSetting<"light" | "dark" | "auto">("theme.mode")
    let [colourScheme] = useSetting<T>("theme.colourScheme")

    return useMemo(() => {
        let resolvedMode = mode
        if (
            mode === "auto" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
            resolvedMode = "dark"
        }

        return [colourScheme, resolvedMode as "light" | "dark"]
    }, [colourScheme, mode])
}
