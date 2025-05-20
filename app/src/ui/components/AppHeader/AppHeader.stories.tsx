import type { Meta, StoryObj } from "@storybook/react"

import "@/ui/styles/index.css"
import { decorator } from "@/lib/testhelper/rootStore"

import { AppHeader } from "./AppHeader"

const meta: Meta<typeof AppHeader> = {
    title: "Components/AppHeader",
    component: AppHeader,
    decorators: [decorator],
}

export default meta
type Story = StoryObj<typeof AppHeader>

export const Basic: Story = {
    name: "AppHeader",
    parameters: {
        layout: "fullscreen",
    },
}
