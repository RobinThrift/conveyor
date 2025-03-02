import type { Meta, StoryObj } from "@storybook/react"

import "@/ui/styles/index.css"
import { decorator } from "@/lib/testhelper/rootStore"

import { SettingsScreen } from "./SettingsScreen"

const meta: Meta<typeof SettingsScreen> = {
    title: "Screens/Settings",
    component: SettingsScreen,
    args: {
        tab: "interface",
    },

    decorators: [decorator],
}

export default meta
type Story = StoryObj<typeof SettingsScreen>

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
