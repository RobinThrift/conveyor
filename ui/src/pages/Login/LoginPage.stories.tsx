import { Provider } from "@/state"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { LoginPage } from "./LoginPage"

import "@/index.css"

const meta: Meta<typeof LoginPage> = {
    title: "Pages/Login/LoginForm",
    component: LoginPage,

    decorators: (Story, { globals: { configureMockRootStore } }) => (
        <Provider store={configureMockRootStore()}>
            <Story />
        </Provider>
    ),
}

export default meta
type Story = StoryObj<typeof LoginPage>

export const LoginForm: Story = {
    parameters: {
        layout: "fullscreen",
    },
}

export const WithError: Story = {
    parameters: {
        layout: "fullscreen",
    },
    args: {
        validationErrors: {
            form: "Invalid Credentials",
        },
    },
}
