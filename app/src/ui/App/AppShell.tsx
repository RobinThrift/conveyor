import React, { Suspense } from "react"

import { BuildInfo } from "@/ui/components/BuildInfo"
import { Navigation } from "@/ui/components/Navigation"
import { Notifications } from "@/ui/components/Notifications"
import { Theme } from "@/ui/components/Theme"
import { useCurrentPage } from "@/ui/navigation"
import { ErrorScreen } from "@/ui/screens/ErrorScreen"
import { InitSetupScreen } from "@/ui/screens/InitSetupScreen/InitSetupScreen"
import { MainScreen } from "@/ui/screens/MainScreen"
import { SettingsScreen } from "@/ui/screens/SettingsScreen"
import { UnlockScreen } from "@/ui/screens/UnlockScreen/UnlockScreen"
import { useTheme } from "@/ui/settings"
import { NewMemoScreen } from "../screens/NewMemoScreen"

export function AppShell() {
    let currentPage = useCurrentPage()

    let { colourScheme, mode } = useTheme()

    let pageComp: React.ReactNode

    if (!currentPage) {
        return (
            <Theme colourScheme={colourScheme} mode={mode}>
                <Suspense>
                    <ErrorScreen
                        title="Page Not Found"
                        code={404}
                        detail="The requested page could not be found"
                    />
                </Suspense>
            </Theme>
        )
    }

    switch (currentPage?.name) {
        case "unlock":
            return (
                <Theme colourScheme={colourScheme} mode={mode}>
                    <Suspense>
                        <UnlockScreen />
                    </Suspense>
                </Theme>
            )
        case "setup":
            return (
                <Theme colourScheme={colourScheme} mode={mode}>
                    <Suspense>
                        <InitSetupScreen />
                    </Suspense>
                </Theme>
            )
        case "root":
        case "memo.view":
        case "memo.edit":
            pageComp = (
                <MainScreen key="main-screen" activeScreen={currentPage.name} />
            )
            break
        case "memo.new":
            pageComp = <NewMemoScreen key="main-screen" />
            break
        case "settings":
            pageComp = <SettingsScreen />
            break
    }

    if (!pageComp) {
        return (
            <Suspense>
                <ErrorScreen
                    title="Page Not Found"
                    code={404}
                    detail="The requested screen could not be found"
                />
            </Suspense>
        )
    }

    return (
        <Theme colourScheme={colourScheme} mode={mode}>
            <Navigation active={currentPage.name ?? "root"} />
            <main className="main">
                {pageComp}
                <footer className="app-footer">
                    <BuildInfo />
                </footer>
            </main>

            <Notifications />
        </Theme>
    )
}
