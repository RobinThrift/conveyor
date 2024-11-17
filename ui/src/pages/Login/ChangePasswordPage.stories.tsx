import type { Meta, StoryObj } from "@storybook/react"
import { ChangePasswordPage } from "./ChangePasswordPage"

import "@/index.css"

const meta: Meta<typeof ChangePasswordPage> = {
    title: "Pages/Login/Change Password",
    component: ChangePasswordPage,
    parameters: {
        layout: "fullscreen",
    },
}

export default meta

type Story = StoryObj<typeof ChangePasswordPage>

export const ChangePasswordForm: Story = {}

export const WithError: Story = {
    args: {
        validationErrors: {
            current_password: "Current Password is incorrect",
            new_password: "New Password don't match",
            form: "General Error",
        },
    },
}
