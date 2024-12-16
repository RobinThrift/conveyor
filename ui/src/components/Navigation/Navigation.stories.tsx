import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { Navigation } from "./Navigation"

import "@/index.css"
import { Provider } from "@/state"

const meta: Meta<typeof Navigation> = {
    title: "Components/Navigation",
    component: Navigation,

    decorators: (Story, { globals: { configureMockRootStore } }) => (
        <Provider store={configureMockRootStore()}>
            <Story />
        </Provider>
    ),
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
