import { Sidebar } from "@/components/Sidebar"
import { Archive, GearFine, Notepad, TrashSimple } from "@phosphor-icons/react"
import React, { Suspense, useCallback } from "react"
import { Router } from "./router"

import { BuildInfo } from "@/components/BuildInfo"
import { Notifications } from "@/components/Notifications"
import { Theme } from "@/components/Theme"
import { useBaseURL } from "@/hooks/useBaseURL"
import { useT } from "@/i18n"
import { ErrorPage } from "@/pages/Errors"
import { ChangePasswordPage, LoginPage } from "@/pages/Login"
import { ListMemosPage } from "@/pages/Memos/List"
import { SingleMemoPage } from "@/pages/Memos/Single"
import { SettingsPage } from "@/pages/Settings"
import { useCurrentPage, useGoto } from "@/state/router"
import { useTheme } from "@/state/settings"
import {
    type Filter,
    filterFromQuery,
    filterToQueryString,
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

    let baseURL = useBaseURL()
    let t = useT("app/navigation")
    let { colourScheme, mode } = useTheme()

    let pageComp: React.ReactNode

    let onChangeFilters = useCallback(
        (filter: Filter) => {
            goto(
                `${globalThis.location.pathname}?${filterToQueryString(filter)}`,
            )
        },
        [goto],
    )

    let onChangeSettingsTab = useCallback(
        (tab: string) => {
            goto(`${baseURL}/settings/${tab}`)
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

        case "root":
        case "memos.list":
            pageComp = (
                <ListMemosPage
                    filter={filterFromQuery(page.search)}
                    onChangeFilters={onChangeFilters}
                />
            )
            break
        case "memos.archive":
            pageComp = (
                <ListMemosPage
                    filter={{
                        ...filterFromQuery(page.search),
                        isArchived: true,
                    }}
                    showEditor={false}
                    onChangeFilters={onChangeFilters}
                />
            )
            break
        case "memos.bin":
            pageComp = (
                <ListMemosPage
                    filter={{
                        ...filterFromQuery(page.search),
                        isDeleted: true,
                    }}
                    showEditor={false}
                    onChangeFilters={onChangeFilters}
                />
            )
            break
        case "memos.single":
            pageComp = (
                <SingleMemoPage
                    memoID={page.params.id}
                    onChangeFilters={onChangeFilters}
                />
            )
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
            <div className="flex gap-4 justify-start">
                <Sidebar
                    className="max-w-[250px] w-[80%] h-screen"
                    items={[
                        {
                            label: t.Memos,
                            url: "/memos",
                            icon: <Notepad weight="duotone" />,
                            isActive:
                                page?.route === "memos.list" ||
                                page?.route === "root",
                        },
                        {
                            label: t.Archive,
                            url: "/memos/archive",
                            icon: <Archive weight="duotone" />,
                            isActive: page?.route === "memos.archive",
                        },
                        {
                            label: t.Bin,
                            url: "/memos/bin",
                            icon: <TrashSimple weight="duotone" />,
                            isActive: page?.route === "memos.bin",
                        },
                        {
                            label: t.Settings,
                            url: "/settings/interface",
                            icon: <GearFine weight="duotone" />,
                            isActive: page?.route === "settings",
                        },
                    ]}
                />
                <main className="flex-1 p-4 pt-12 md:ps-0 sm:pt-4 overflow-x-hidden overflow-y-auto h-screen">
                    <Suspense>{pageComp}</Suspense>
                    <footer className="p-2 flex justify-start items-center">
                        <BuildInfo />
                    </footer>
                </main>

                <Notifications />
            </div>
        </Theme>
    )
}
