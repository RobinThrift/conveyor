import type { Preview } from "@storybook/react"
import { initialize, mswLoader } from "msw-storybook-addon"
import React, { useEffect } from "react"
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
                localStorage.getItem("belt.settings.theme.colourScheme") ??
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
        (Story, { globals: { themeMode, themeColours } }) => {
            useEffect(() => {
                let current =
                    document.documentElement.dataset.colourScheme ?? ""
                if (current) {
                    document.documentElement.classList.remove(current)
                }

                document.documentElement.classList.add(themeColours)
                document.documentElement.dataset.colourScheme = themeColours

                localStorage.setItem(
                    "belt.settings.theme.colourScheme",
                    themeColours,
                )
            }, [themeColours])

            useEffect(() => {
                document.documentElement.classList.toggle(
                    "dark",
                    themeMode === "dark" ||
                        (themeMode === "auto" &&
                            window.matchMedia("(prefers-color-scheme: dark)")
                                .matches),
                )
                localStorage.setItem("belt.settings.theme.mode", themeMode)
            }, [themeMode])

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
        themeColours: {
            description: "Colour Scheme",
            defaultValue:
                localStorage.getItem("belt.settings.theme.colourScheme") ??
                "default",
            toolbar: {
                title: "Default",
                icon: "contrast",
                items: [
                    { value: "default", title: "Default" },
                    { value: "rosepine", title: "Rosé Pine" },
                ],
                dynamicTitle: true,
            },
        },
        themeMode: {
            description: "Mode",
            defaultValue:
                localStorage.getItem("belt.settings.theme.mode") ?? "auto",
            toolbar: {
                title: "Auto",
                icon: "lightning",
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
