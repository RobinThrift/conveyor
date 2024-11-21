import { Sidebar } from "@/components/Sidebar"
import { useStore } from "@nanostores/react"
import { Archive, GearFine, Notepad, TrashSimple } from "@phosphor-icons/react"
import React, { Suspense, useCallback } from "react"
import type { ServerData } from "./ServerData"
import { $router } from "./router"

import { useT } from "@/i18n"
import { ErrorPage } from "@/pages/Errors"
import { ChangePasswordPage, LoginPage } from "@/pages/Login"
import { ListMemosPage } from "@/pages/Memos/List"
import { Filter, filterFromQuery, filterToQueryString } from "@/api/memos"

export type AppProps = ServerData

export function App(props: AppProps) {
    let page = useStore($router)
    let t = useT("app/navigation")

    let pageComp: React.ReactNode

    let onChangeFilters = useCallback((filter: Filter) => {
        console.log(
            `${globalThis.location.pathname}?${filterToQueryString(filter)}`,
        )
        $router.open(
            `${globalThis.location.pathname}?${filterToQueryString(filter)}`,
        )
    }, [])

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
        <div className="flex gap-4 justify-start flex-col">
            <Sidebar
                className="sm:w-[250px] w-[80%] h-screen fixed"
                username="User"
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
                        url: "/archive",
                        icon: <Archive weight="duotone" />,
                        // isActive: page?.route === "memos.archive"
                        isActive: false,
                    },
                    {
                        label: t.Bin,
                        url: "/bin",
                        icon: <TrashSimple weight="duotone" />,
                        // isActive: page?.route === "memos.bin"
                        isActive: false,
                    },
                    {
                        label: t.Settings,
                        url: "/settings",
                        icon: <GearFine weight="duotone" />,
                        // isActive: page?.route === "settings"
                        isActive: false,
                    },
                ]}
            />
            <main className="flex-1 p-4 pt-0 2xl:pt-4 overflow-hiddden">
                <Suspense>{pageComp}</Suspense>
            </main>
        </div>
    )
}
