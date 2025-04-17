import "vite/modulepreload-polyfill"
import React from "react"
import ReactDOM from "react-dom/client"

import { App } from "@/ui/App"
import { serverData } from "@/ui/App/ServerData"
import {
    AttachmentProvider,
    attachmentContextFromController,
} from "@/ui/attachments"
import { SettingsLoader } from "@/ui/settings"
import { Provider } from "@/ui/state"

import "@/ui/styles/index.css"

import { Env } from "./env"
import { init } from "./init"
import { NavigationProvider } from "./ui/navigation"
import { DevTools } from "./ui/state/DevTools"

main()

async function main() {
    let { rootStore, attachmentCtrl, navCtrl } = await init()

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
