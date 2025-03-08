import React, { Suspense, useCallback } from "react"

import {
    type ListMemosQuery as Filter,
    filterFromQuery,
    filterToSearchParams,
} from "@/domain/Memo"
import { BuildInfo } from "@/ui/components/BuildInfo"
import { Navigation } from "@/ui/components/Navigation"
import { Notifications } from "@/ui/components/Notifications"
import { Theme } from "@/ui/components/Theme"
import { useBaseURL } from "@/ui/hooks/useBaseURL"
import { EditMemoScreen } from "@/ui/screens/EditMemoScreen"
import { ErrorScreen } from "@/ui/screens/ErrorScreen"
import { MainScreen } from "@/ui/screens/MainScreen"
import { NewMemoScreen } from "@/ui/screens/NewMemoScreen"
import { SettingsScreen } from "@/ui/screens/SettingsScreen"
import { SingleMemoScreen } from "@/ui/screens/SingleMemoScreen"
import { useTheme } from "@/ui/settings"
import { useCurrentPage, useGoto } from "@/ui/state/global/router"
import { UnlockScreen } from "../screens/UnlockScreen/UnlockScreen"
import type { ServerData } from "./ServerData"
import { Router } from "./router"

export type AppProps = Pick<ServerData, "error">

export function App(props: AppProps) {
    if (props.error) {
        return (
            <Suspense>
                <ErrorScreen {...props.error} />
            </Suspense>
        )
    }

    return (
        <Router>
            <AppShell />
        </Router>
    )
}

function AppShell() {
    let page = useCurrentPage()
    let goto = useGoto()

    let baseURL = useBaseURL()
    let { colourScheme, mode } = useTheme()

    let pageComp: React.ReactNode

    let onChangeFilter = useCallback(
        (filter: Filter) => {
            goto("/", filterToSearchParams(filter))
        },
        [goto],
    )

    let onChangeSettingsTab = useCallback(
        (tab: string) => {
            goto(`${baseURL}/settings/${tab}`, undefined, {
                viewTransition: true,
            })
        },
        [baseURL, goto],
    )

    if (!page) {
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

    switch (page?.route) {
        case "unlock":
            return (
                <Theme colourScheme={colourScheme} mode={mode}>
                    <Suspense>
                        <UnlockScreen />
                    </Suspense>
                </Theme>
            )
        case "main":
            pageComp = (
                <MainScreen
                    filter={filterFromQuery(page.search)}
                    onChangeFilter={onChangeFilter}
                />
            )
            break
        case "memos.single":
            pageComp = <SingleMemoScreen memoID={page.params.id} />
            break
        case "memos.edit":
            pageComp = (
                <EditMemoScreen
                    memoID={page.params.id}
                    position={
                        page.search.x && page.search.y
                            ? {
                                  x: Number.parseInt(page.search.x, 10),
                                  y: Number.parseInt(page.search.y, 10),
                                  snippet: page.search.snippet,
                              }
                            : undefined
                    }
                />
            )
            break
        case "memos.new":
            pageComp = <NewMemoScreen />
            break
        case "settings":
            pageComp = (
                <SettingsScreen
                    tab={page.params.tab}
                    onChangeTab={onChangeSettingsTab}
                />
            )
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
            <Navigation active={page?.route ?? "memos.list"} />
            <main className="main">
                <Suspense>{pageComp}</Suspense>
                <footer className="app-footer">
                    <BuildInfo />
                </footer>
            </main>

            <Notifications />
        </Theme>
    )
}
