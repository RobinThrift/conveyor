import React, { Suspense } from "react"

import { ErrorScreen } from "@/ui/screens/ErrorScreen"

import { AppShell } from "./AppShell"
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
