import React, { useEffect } from "react"

import type { ColourSchemeMode, ColourSchemeNames } from "@/domain/Settings"

export function Theme({
    colourScheme,
    mode,
    children,
}: React.PropsWithChildren<{
    colourScheme: ColourSchemeNames
    mode: ColourSchemeMode
}>) {
    useEffect(() => {
        let current = document.documentElement.dataset.colourScheme ?? ""
        if (current) {
            document.documentElement.classList.remove(current)
        }

        document.documentElement.classList.add(colourScheme)
        document.documentElement.dataset.colourScheme = colourScheme
    }, [colourScheme])

    useEffect(() => {
        switch (mode) {
            case "auto":
                document.documentElement.classList.toggle(
                    "dark",
                    window.matchMedia("(prefers-color-scheme: dark)").matches,
                )
                break
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
    }, [mode])

    return children
}
