import type { Meta, StoryObj } from "@storybook/react"

import "@/ui/styles/index.css"
import { decorator } from "@/lib/testhelper/rootStore"

import { SettingsScreen } from "./SettingsScreen"

const meta: Meta<typeof SettingsScreen> = {
    title: "Screens/Settings",
    component: SettingsScreen,
    decorators: [decorator],
}

export default meta
type Story = StoryObj<typeof SettingsScreen>

export const Settings: Story = {}
