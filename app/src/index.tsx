import "vite/modulepreload-polyfill"
import React from "react"
import ReactDOM from "react-dom/client"

import { Env } from "@/env"
import { init } from "@/init"
import { fromPromise } from "@/lib/result"
import { App } from "@/ui/App"
import { serverData } from "@/ui/App/ServerData"
import {
    AttachmentProvider,
    attachmentContextFromController,
} from "@/ui/attachments"
import { Alert } from "@/ui/components/Alert"
import { NavigationProvider } from "@/ui/navigation"
import { SettingsLoader } from "@/ui/settings"
import { Provider } from "@/ui/state"
import { DevTools } from "@/ui/state/DevTools"

import "@/ui/styles/index.css"

main()

async function main() {
    let initResult = await fromPromise(init())
    if (!initResult.ok) {
        ReactDOM.createRoot(
            // biome-ignore lint/style/noNonNullAssertion: if this is null all is lost anyway
            document.getElementById("__CONVEYOR_UI_ROOT__")!,
        ).render(
            <Alert variant="danger">
                {initResult.err.name}: {initResult.err.message}
                {initResult.err.stack && (
                    <pre>
                        <code>{initResult.err.stack}</code>
                    </pre>
                )}
            </Alert>,
        )
        return
    }

    let { rootStore, attachmentCtrl, navCtrl } = initResult.value

    document.body.classList.add(`platform-${Env.platform}`)

    let devTools: React.ReactNode | null = null
    // biome-ignore lint/nursery/noProcessEnv: only used for development
    if (process.env.NODE_ENV === "development") {
        devTools = <DevTools />
    }

    ReactDOM.createRoot(
        // biome-ignore lint/style/noNonNullAssertion: if this is null all is lost anyway
        document.getElementById("__CONVEYOR_UI_ROOT__")!,
    ).render(
        <Provider store={rootStore}>
            <React.StrictMode>
                <NavigationProvider value={navCtrl}>
                    <AttachmentProvider
                        value={attachmentContextFromController(attachmentCtrl)}
                    >
                        <SettingsLoader>
                            <App {...serverData} />
                        </SettingsLoader>
                    </AttachmentProvider>
                </NavigationProvider>
            </React.StrictMode>
            {devTools}
        </Provider>,
    )
}
