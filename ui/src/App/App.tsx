import React, { Suspense, useCallback } from "react"
import { Router } from "./router"

import { BuildInfo } from "@/components/BuildInfo"
import { Navigation } from "@/components/Navigation"
import { Notifications } from "@/components/Notifications"
import { Theme } from "@/components/Theme"
import { useBaseURL } from "@/hooks/useBaseURL"
import { useEnsureLoggedIn } from "@/hooks/useEnsureLoggedIn"
import { ErrorPage } from "@/pages/Errors"
import { ChangePasswordPage, LoginPage } from "@/pages/Login"
import { MemoEditPage } from "@/pages/Memos/Edit"
import { MemosListPage } from "@/pages/Memos/List"
import { MemoNewPage } from "@/pages/Memos/New"
import { MemoSinglePage } from "@/pages/Memos/Single"
import { SettingsPage } from "@/pages/Settings"
import { useCurrentPage, useGoto } from "@/state/global/router"
import { useTheme } from "@/state/global/settings"
import {
    type Filter,
    filterFromQuery,
    filterToSearchParams,
} from "@/storage/memos"
import type { ServerData } from "./ServerData"

export type AppProps = Pick<ServerData, "components" | "error">

export function App(props: AppProps) {
    if (props.error) {
        return (
            <Suspense>
                <ErrorPage {...props.error} />
            </Suspense>
        )
    }

    return (
        <Router>
            <AppShell components={props.components} />
        </Router>
    )
}

function AppShell({ ...props }: { components: AppProps["components"] }) {
    let page = useCurrentPage()
    let goto = useGoto()
    useEnsureLoggedIn(!(page?.route?.includes("login") ?? true))

    let baseURL = useBaseURL()
    let { colourScheme, mode } = useTheme()

    let pageComp: React.ReactNode

    let onChangeFilters = useCallback(
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
                    <ErrorPage
                        title="Page Not Found"
                        code={404}
                        detail="The requested page could not be found"
                    />
                </Suspense>
            </Theme>
        )
    }

    switch (page?.route) {
        case "login":
            return (
                <Theme colourScheme={colourScheme} mode={mode}>
                    <Suspense>
                        <LoginPage {...props.components.LoginPage} />
                    </Suspense>
                </Theme>
            )
        case "login.change_password":
            return (
                <Theme colourScheme={colourScheme} mode={mode}>
                    <Suspense>
                        <ChangePasswordPage
                            {...props.components.LoginChangePasswordPage}
                        />
                    </Suspense>
                </Theme>
            )

        case "memos.list":
            pageComp = (
                <MemosListPage
                    filter={filterFromQuery(page.search)}
                    onChangeFilters={onChangeFilters}
                />
            )
            break
        case "memos.single":
            pageComp = <MemoSinglePage memoID={page.params.id} />
            break
        case "memos.edit":
            pageComp = (
                <MemoEditPage
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
            pageComp = <MemoNewPage />
            break
        case "settings":
            pageComp = (
                <SettingsPage
                    {...props.components.SettingsPage}
                    tab={page.params.tab}
                    onChangeTab={onChangeSettingsTab}
                />
            )
            break
    }

    if (!pageComp) {
        return (
            <Suspense>
                <ErrorPage
                    title="Page Not Found"
                    code={404}
                    detail="The requested page could not be found"
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
