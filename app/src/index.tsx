import { registerSW } from "virtual:pwa-register"
import React from "react"
import ReactDOM from "react-dom/client"

import { history } from "@/external/browser/history"
import { App } from "@/ui/App"
import { serverData } from "@/ui/App/ServerData"
import * as eventbus from "@/ui/eventbus"
import { Provider, actions, configureRootStore } from "@/ui/state"

import "@/ui/styles/index.css"

let rootStore = configureRootStore({
    baseURL:
        globalThis.document
            ?.querySelector("meta[name=base-url]")
            ?.getAttribute("content")
            ?.replace(/\/$/, "") ?? "",
    router: { href: history.current },
})

eventbus.on("notifications:add", (notification) => {
    rootStore.dispatch(actions.global.notifications.add({ notification }))
})

const updateSW = registerSW({
    onNeedRefresh() {
        rootStore.dispatch(
            actions.global.notifications.add({
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
            actions.global.notifications.add({
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
