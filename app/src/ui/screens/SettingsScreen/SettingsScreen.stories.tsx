import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import "@/ui/styles/index.css"
import { withMockBackend } from "@/lib/testhelper/storybook"

import { SettingsScreen } from "./SettingsScreen"

const meta: Meta<typeof SettingsScreen> = {
    title: "Screens/Settings",
    component: SettingsScreen,
    decorators: [withMockBackend({})],
}

export default meta
type Story = StoryObj<typeof SettingsScreen>

export const Settings: Story = {
    render: () => <SettingsScreen />,
}
