import { Provider } from "@/state"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { ChangePasswordPage } from "./ChangePasswordPage"

import "@/index.css"

const meta: Meta<typeof ChangePasswordPage> = {
    title: "Pages/Login/Change Password",
    component: ChangePasswordPage,
    parameters: {
        layout: "fullscreen",
    },
    decorators: (Story, { globals: { configureMockRootStore } }) => (
        <Provider store={configureMockRootStore()}>
            <Story />
        </Provider>
    ),
}

export default meta

type Story = StoryObj<typeof ChangePasswordPage>

export const ChangePasswordForm: Story = {}

export const WithError: Story = {
    args: {
        validationErrors: {
            current_password: "CurrentPasswordIncorrect",
            new_password: "NewPasswordIsOldPassword",
            repeat_new_password: "NewPasswordsDoNotMatch",
            form: "General form error",
        },
    },
}
