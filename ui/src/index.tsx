import { registerSW } from "virtual:pwa-register"
import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./App"
import "@/index.css"
import { add as addNotification } from "@/notifications/store"
import { accountStore } from "@/storage/account"
import { settingsStore } from "@/storage/settings"
import { serverData } from "./App/ServerData"

settingsStore.init(serverData.settings)

accountStore.set(serverData.account)

// biome-ignore lint/style/noNonNullAssertion: if this is null all is lost anyway
ReactDOM.createRoot(document.getElementById("__BELT_UI_ROOT__")!).render(
    <React.StrictMode>
        <App {...serverData} />
    </React.StrictMode>,
)

const updateSW = registerSW({
    onNeedRefresh() {
        addNotification({
            type: "info",
            title: "Update Available",
            requiresAction: true,
            buttons: [
                {
                    children: "Update",
                    ariaLabel: "Update",
                    onClick: () => updateSW(),
                },
            ],
        })
    },

    onRegisterError: (err) => {
        let [title, message] = err.message.split(/:\n/, 2)
        addNotification({
            type: "error",
            title,
            message,
        })
    },
})
