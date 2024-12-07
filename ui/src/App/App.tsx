import { Sidebar } from "@/components/Sidebar"
import { useStore } from "@nanostores/react"
import { Archive, GearFine, Notepad, TrashSimple } from "@phosphor-icons/react"
import React, { Suspense, useCallback } from "react"
import { $router } from "./router"

import { type Filter, filterFromQuery, filterToQueryString } from "@/api/memos"
import { BuildInfo } from "@/components/BuildInfo"
import { useBaseURL } from "@/hooks/useBaseURL"
import { useT } from "@/i18n"
import { ErrorPage } from "@/pages/Errors"
import {
    ChangePasswordPage,
    type ChangePasswordPageProps,
    LoginPage,
    type LoginPageProps,
} from "@/pages/Login"
import { ListMemosPage } from "@/pages/Memos/List"
import { SingleMemoPage } from "@/pages/Memos/Single"
import { SettingsPage } from "@/pages/Settings"

export interface AppProps {
    /* Specific component props that need data from the server, e.g. based on the request or errors. */
    components: {
        LoginPage: LoginPageProps
        LoginChangePasswordPage: ChangePasswordPageProps
    }

    error?: {
        code: number
        title: string
        detail: string
    }
}

export function App(props: AppProps) {
    let baseURL = useBaseURL()
    let page = useStore($router)
    let t = useT("app/navigation")

    let pageComp: React.ReactNode

    let onChangeFilters = useCallback((filter: Filter) => {
        $router.open(
            `${globalThis.location.pathname}?${filterToQueryString(filter)}`,
        )
    }, [])

    let onChangeSettingsTab = useCallback(
        (tab: string) => {
            $router.open(`${baseURL}/settings/${tab}`)
        },
        [baseURL],
    )

    if (props.error) {
        return (
            <Suspense>
                <ErrorPage {...props.error} />
            </Suspense>
        )
    }

    switch (page?.route) {
        case "login":
            return (
                <Suspense>
                    <LoginPage {...props.components.LoginPage} />
                </Suspense>
            )
        case "login.change_password":
            return (
                <Suspense>
                    <ChangePasswordPage
                        {...props.components.LoginChangePasswordPage}
                    />
                </Suspense>
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
            <main className="flex-1 p-4 pt-12 md:ps-0 md:pt-4 overflow-x-hidden overflow-y-auto h-screen">
                <Suspense>{pageComp}</Suspense>
                <footer className="p-2 flex justify-end items-center">
                    <BuildInfo />
                </footer>
            </main>
        </div>
    )
}
