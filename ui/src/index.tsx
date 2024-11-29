import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./App"
import "@/index.css"
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
