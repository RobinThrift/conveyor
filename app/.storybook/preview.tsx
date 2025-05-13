import type { Preview } from "@storybook/react"
import { initialize, mswLoader } from "msw-storybook-addon"
import React, { useEffect } from "react"

import { Theme } from "../src/ui/components/Theme"
import { mockAPI } from "./mockapi"

// Initialize MSW
initialize({
    onUnhandledRequest: "bypass",
})

const preview: Preview = {
    parameters: {
        actions: { argTypesRegex: "^on[A-Z].*" },
        msw: {
            handlers: mockAPI,
        },

        viewport: {
            viewports: {
                phone: {
                    name: "Phone",
                    styles: {
                        height: "852px",
                        width: "393px",
                    },
                    type: "mobile",
                },
                xs: {
                    name: "Small Window",
                    styles: {
                        width: "768px",
                        height: "900px",
                    },
                    type: "desktop",
                },
                tablet: {
                    name: "Tablet",
                    styles: {
                        height: "1024px",
                        width: "768px",
                    },
                    type: "desktop",
                },
                sm: {
                    name: "Small",
                    styles: {
                        width: "1440px",
                        height: "900px",
                    },
                    type: "desktop",
                },
                md: {
                    name: "Medium",
                    styles: {
                        width: "1680px",
                        height: "1050px",
                    },
                    type: "desktop",
                },
                lg: {
                    name: "Large",
                    styles: {
                        width: "2100px",
                        height: "1280px",
                    },
                    type: "desktop",
                },
            },
        },
    },

    loaders: [mswLoader],

    decorators: [
        (Story, { globals: { themeMode, themeColours, serverData } }) => {
            useEffect(() => {
                localStorage.setItem(
                    "belt.settings.theme.colourScheme",
                    themeColours,
                )
            }, [themeColours])

            useEffect(() => {
                localStorage.setItem("belt.settings.theme.mode", themeMode)
            }, [themeMode])

            if (!document.getElementById("__belt_ui_data__")) {
                let uiElement = document.createElement("script")
                uiElement.type = "belt_ui/data"
                uiElement.id = "__belt_ui_data__"
                uiElement.innerHTML = JSON.stringify(serverData)
                document.body.prepend(uiElement)
            }

            if (!document.querySelector("meta[name=theme-color]")) {
                let metaThemeEl = document.createElement("meta")
                metaThemeEl.name = "theme-color"
                metaThemeEl.content = ""
                document.head.prepend(metaThemeEl)
            }

            return (
                <Theme
                    colourScheme={{ light: themeColours, dark: themeColours }}
                    mode={themeMode}
                >
                    <Story />
                </Theme>
            )
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
                    { value: "warm", title: "Warm" },
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
