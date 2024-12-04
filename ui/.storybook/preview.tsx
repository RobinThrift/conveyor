import type { Preview } from "@storybook/react"
import { initialize, mswLoader } from "msw-storybook-addon"
import React from "react"
import { mockAPI } from "./mockapi"
import type { ServerData } from "../src/App/ServerData"
import { settingsStore } from "../src/storage/settings"
import { accountStore } from "../src/storage/account"

// Initialize MSW
initialize({
    onUnhandledRequest: "bypass",
})

let serverData: ServerData = {
    account: {
        username: "user",
        displayName: "Test User",
    },

    settings: {
        locale: {
            language:
                localStorage.getItem("belt.settings.locale.language") ?? "en",
            region: localStorage.getItem("belt.settings.locale.region") ?? "gb",
        },

        theme: {
            colourScheme:
                localStorage.getItem("belt.settings.theme.language") ??
                "default",
            mode: localStorage.getItem("belt.settings.theme.mode") ?? "auto",
            icon: localStorage.getItem("belt.settings.theme.icon") ?? "default",
        },
        controls: {
            vim: JSON.parse(
                localStorage.getItem("belt.settings.controls.vim") ?? "true",
            ),
            doubleClickToEdit: JSON.parse(
                localStorage.getItem(
                    "belt.settings.controls.doubleClickToEdit",
                ) ?? "true",
            ),
        },
    },

    components: {
        LoginPage: {},
        LoginChangePasswordPage: {},
        SettingsPage: { validationErrors: {} },
    },
}

const preview: Preview = {
    parameters: {
        actions: { argTypesRegex: "^on[A-Z].*" },
        msw: {
            handlers: mockAPI,
        },
    },

    loaders: [mswLoader],

    decorators: [
        (Story, { globals: { theme } }) => {
            document.documentElement.classList.toggle(
                "dark",
                theme === "dark" ||
                    (theme === "auto" &&
                        window.matchMedia("(prefers-color-scheme: dark)")
                            .matches),
            )

            if (!document.getElementById("__belt_ui_data__")) {
                settingsStore.init(serverData.settings)
                accountStore.set(serverData.account)

                let uiElement = document.createElement("script")
                uiElement.type = "belt_ui/data"
                uiElement.id = "__belt_ui_data__"
                uiElement.innerHTML = JSON.stringify(serverData)
                document.body.prepend(uiElement)
            }

            return <Story />
        },
    ],

    globalTypes: {
        theme: {
            description: "Theme",
            defaultValue: "auto",
            toolbar: {
                title: "Auto",
                icon: "switchalt",
                items: [
                    { value: "auto", title: "Auto" },
                    { value: "dark", title: "Dark" },
                    { value: "light", title: "Light" },
                ],
                dynamicTitle: true,
            },
        },
    },
}

export default preview
