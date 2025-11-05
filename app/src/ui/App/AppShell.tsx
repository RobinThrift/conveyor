import React from "react"

import { Theme } from "@/ui/components/Theme"
import { I18nProvider } from "@/ui/i18n"
import { useTheme } from "@/ui/settings"
import { Router } from "./Router"

export function AppShell() {
    let { colourScheme, mode } = useTheme()

    return (
        <Theme colourScheme={colourScheme} mode={mode}>
            <I18nProvider>
                <Router />
            </I18nProvider>
        </Theme>
    )
}
