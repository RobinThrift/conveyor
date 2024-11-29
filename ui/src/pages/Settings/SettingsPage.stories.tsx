import type { Meta, StoryObj } from "@storybook/react"
import { SettingsPage } from "./SettingsPage"

import "@/index.css"

const meta: Meta<typeof SettingsPage> = {
    title: "Pages/Settings",
    component: SettingsPage,
    args: {
        tab: "interface",
    },
}

export default meta
type Story = StoryObj<typeof SettingsPage>

export const Settings: Story = {}

export const WithErrorsAccount: Story = {
    name: "With Errors/Account",
    args: {
        tab: "account",
        validationErrors: {
            current_password: "CurrentPasswordIncorrect",
            new_password: "NewPasswordIsOldPassword",
            repeat_new_password: "NewPasswordsDoNotMatch",
        },
    },
}
