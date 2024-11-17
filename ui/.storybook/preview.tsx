import type { Preview } from "@storybook/react"
import { initialize, mswLoader } from "msw-storybook-addon"
import React from "react"
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
