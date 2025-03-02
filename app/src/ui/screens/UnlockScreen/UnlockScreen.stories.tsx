import type { Meta, StoryObj } from "@storybook/react"

import { decorator } from "@/lib/testhelper/rootStore"
import "@/ui/styles/index.css"

import { UnlockScreen } from "./UnlockScreen"

const meta: Meta<typeof UnlockScreen> = {
    title: "Screens/Unlock",
    component: UnlockScreen,

    decorators: [decorator],
}

export default meta
type Story = StoryObj<typeof UnlockScreen>

export const Unlock: Story = {
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
