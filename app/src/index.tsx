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

main()

async function main() {
    let { rootStore, attachmentCtrl, navCtrl } = await init()

    document.body.classList.add(`platform-${Env.platform}`)

    ReactDOM.createRoot(
        // biome-ignore lint/style/noNonNullAssertion: if this is null all is lost anyway
        document.getElementById("__CONVEYOR_UI_ROOT__")!,
    ).render(
        <React.StrictMode>
            <Provider store={rootStore}>
                <NavigationProvider value={navCtrl}>
                    <AttachmentProvider
                        value={attachmentContextFromController(attachmentCtrl)}
                    >
                        <SettingsLoader>
                            <App {...serverData} />
                        </SettingsLoader>
                    </AttachmentProvider>
                </NavigationProvider>
            </Provider>
        </React.StrictMode>,
    )
}
