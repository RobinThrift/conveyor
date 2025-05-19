import React, { Suspense } from "react"

import { ErrorScreen } from "@/ui/screens/ErrorScreen"

import { AppShell } from "./AppShell"

export interface AppProps {
    error?: {
        code: number
        title: string
        detail: string
    }
}

export function App(props: AppProps) {
    if (props.error) {
        return (
            <Suspense>
                <ErrorScreen {...props.error} />
            </Suspense>
        )
    }

    return <AppShell />
}
