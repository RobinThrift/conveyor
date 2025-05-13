import React, { useEffect, useSyncExternalStore } from "react"

import type { ColourSchemeMode, ColourSchemeNames } from "@/domain/Settings"

export function Theme({
    colourScheme,
    mode,
    children,
}: React.PropsWithChildren<{
    colourScheme: Record<"light" | "dark", ColourSchemeNames>
    mode: ColourSchemeMode
}>) {
    let prefersDark = useSyncExternalStore(subscribe, getSnapshot)
    let effectiveMode: ColourSchemeMode =
        (mode === "auto" && prefersDark) || mode === "dark" ? "dark" : "light"

    useEffect(() => {
        let current = document.documentElement.dataset.colourScheme ?? ""
        if (current) {
            document.documentElement.classList.remove(current)
        }

        document.documentElement.classList.add(colourScheme[effectiveMode])
        document.documentElement.dataset.colourScheme =
            colourScheme[effectiveMode]
    }, [colourScheme, effectiveMode])

    useEffect(() => {
        switch (effectiveMode) {
            case "light":
                document.documentElement.classList.remove("dark")
                break
            case "dark":
                document.documentElement.classList.add("dark")
                break
        }

        let bgColour = getComputedStyle(
            document.documentElement,
        ).getPropertyValue("--body-bg")

        document
            .querySelector("meta[name=theme-color]")
            ?.setAttribute("content", `rgb(${bgColour})`)

        document.documentElement.dataset.design = "default"
    }, [effectiveMode])

    return children
}

function getSnapshot() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function subscribe(callback: () => void) {
    let mql = window.matchMedia("(prefers-color-scheme: dark)")
    let onChange = () => {
        callback()
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
}
