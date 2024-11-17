import type { Meta, StoryObj } from "@storybook/react"
import { LoginPage } from "./LoginPage"

import "@/index.css"

const meta: Meta<typeof LoginPage> = {
    title: "Pages/Login/LoginForm",
    component: LoginPage,
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
