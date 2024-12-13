import { Provider } from "@/state"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { App, type AppProps } from "./App"

import "@/index.css"

const meta: Meta<AppProps> = {
    title: "Belt/App",
    component: App,
    decorators: (Story, { globals: { configureMockRootStore } }) => (
        <Provider store={configureMockRootStore()}>
            <Story />
        </Provider>
    ),
}

export default meta
type Story = StoryObj<AppProps>

export const Full: Story = {
    name: "App",
    parameters: {
        layout: "fullscreen",
    },

    args: {
        components: {
            LoginPage: { redirectURL: "" },
            LoginChangePasswordPage: { redirectURL: "" },
            SettingsPage: { validationErrors: {} },
        },
    },
}
