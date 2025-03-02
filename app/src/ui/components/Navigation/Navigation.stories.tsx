import type { Meta, StoryObj } from "@storybook/react"

import "@/ui/styles/index.css"
import { decorator } from "@/lib/testhelper/rootStore"

import { Navigation } from "./Navigation"

const meta: Meta<typeof Navigation> = {
    title: "Components/Navigation",
    component: Navigation,
    decorators: [decorator],
}

export default meta
type Story = StoryObj<typeof Navigation>

export const Basic: Story = {
    name: "Navigation",
    parameters: {
        layout: "fullscreen",
    },

    args: {
        active: "memos.list",
    },
}
