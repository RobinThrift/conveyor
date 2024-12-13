import { registerSW } from "virtual:pwa-register"
import { Provider, actions, configureRootStore } from "@/state"
import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./App"
import "@/index.css"
import * as eventbus from "@/eventbus"
import { serverData } from "./App/ServerData"

let rootStore = configureRootStore({
    baseURL:
        globalThis.document
            ?.querySelector("meta[name=base-url]")
            ?.getAttribute("content")
            ?.replace(/\/$/, "") ?? "",
    router: { href: location.href },
    buildInfo: serverData.buildInfo,
    account: serverData.account,
    settings: serverData.settings,
})

eventbus.on("notifications:add", (notification) => {
    rootStore.dispatch(actions.notifications.add({ notification }))
})

const updateSW = registerSW({
    onNeedRefresh() {
        rootStore.dispatch(
            actions.notifications.add({
                notification: {
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
                },
            }),
        )
    },

    onRegisterError: (err) => {
        let [title, message] = err.message.split(/:\n/, 2)
        rootStore.dispatch(
            actions.notifications.add({
                notification: {
                    type: "error",
                    title,
                    message,
                },
            }),
        )
    },
})

// biome-ignore lint/style/noNonNullAssertion: if this is null all is lost anyway
ReactDOM.createRoot(document.getElementById("__BELT_UI_ROOT__")!).render(
    <React.StrictMode>
        <Provider store={rootStore}>
            <App {...serverData} />
        </Provider>
    </React.StrictMode>,
)
