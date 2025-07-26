import { useStore } from "@tanstack/react-store"
import React from "react"
import ReactDOM from "react-dom/client"

import type { NavigationController } from "@/control/NavigationController"
import { Env } from "@/env"
import { App } from "@/ui/App"
import { Loader } from "@/ui/components/Loader"
import { PrettyError } from "@/ui/components/PrettyError"
import { NavigationProvider } from "@/ui/navigation"
import { stores } from "@/ui/stores"
import { initDevTools } from "./devtools"

export async function initUI({
    rootElement,
    navCtrl,
    serverError,
}: {
    rootElement: HTMLElement
    navCtrl: NavigationController
    serverError?: any
}) {
    document.body.classList.add(`platform-${Env.platform}`)

    initDevTools?.()

    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <NavigationProvider value={navCtrl}>
                <WaitForReady>
                    <App error={serverError?.error} />
                </WaitForReady>
            </NavigationProvider>
        </React.StrictMode>,
    )
}

function WaitForReady({ children }: React.PropsWithChildren) {
    let isReady = useStore(stores.backend.isReady)
    let backendReadyErr = useStore(stores.backend.error)

    if (backendReadyErr) {
        return <PrettyError error={backendReadyErr} />
    }

    if (!isReady) {
        return (
            <div className="flex items-center justify-center w-[100dvw] h-[100dvh]">
                <Loader />
            </div>
        )
    }

    return children
}
