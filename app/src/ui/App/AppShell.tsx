import React, { Suspense, useEffect, useState } from "react"

import { AppHeaderProvider } from "@/ui/components/AppHeader"
import { BuildInfo } from "@/ui/components/BuildInfo"
import { Notifications } from "@/ui/components/Notifications"
import { Theme } from "@/ui/components/Theme"
import { useCurrentPage } from "@/ui/navigation"
import { ErrorScreen } from "@/ui/screens/ErrorScreen"
import { InitSetupScreen } from "@/ui/screens/InitSetupScreen/InitSetupScreen"
import { MainScreen } from "@/ui/screens/MainScreen"
import { NewMemoScreen } from "@/ui/screens/NewMemoScreen"
import { SettingsScreen } from "@/ui/screens/SettingsScreen"
import { UnlockScreen } from "@/ui/screens/UnlockScreen/UnlockScreen"
import { useTheme } from "@/ui/settings"
import { I18nProvider } from "../i18n"

function useAppShellState() {
    let currentPage = useCurrentPage()
    let { colourScheme, mode } = useTheme()

    return {
        currentPage,
        colourScheme,
        mode,
    }
}

export function AppShell() {
    let { currentPage, colourScheme, mode } = useAppShellState()

    let [pageComp, setPageComp] = useState<React.ReactNode[] | undefined>()

    useEffect(() => {
        setPageComp((prevPageComp) => {
            switch (currentPage?.name) {
                case "unlock":
                    return [
                        <Suspense key="main-screen-suspense">
                            <UnlockScreen key="main-screen" />
                        </Suspense>,
                    ]
                case "setup":
                    return [
                        <Suspense key="main-screen-suspense">
                            <InitSetupScreen key="main-screen" />
                        </Suspense>,
                    ]
                case "root":
                case "memo.view":
                case "memo.edit":
                    return [
                        <Suspense key="main-screen-suspense">
                            <MainScreen
                                key="main-screen"
                                activeScreen={currentPage.name}
                            />
                        </Suspense>,
                    ]
                case "memo.new":
                    return [
                        <Suspense key="main-screen-suspense">
                            <NewMemoScreen key="main-screen" />
                        </Suspense>,
                    ]
                case "settings":
                    return [
                        ...(prevPageComp ?? []),
                        <Suspense key="settings-screen-overlay-suspense">
                            <SettingsScreen key="settings-screen-overlay" />,
                        </Suspense>,
                    ]
            }
        })
    }, [currentPage?.name])

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
            <I18nProvider>
                <AppHeaderProvider />
                <main className="main">
                    {pageComp}
                    <footer className="app-footer">
                        <BuildInfo />
                    </footer>
                </main>

                <Notifications />
            </I18nProvider>
        </Theme>
    )
}
