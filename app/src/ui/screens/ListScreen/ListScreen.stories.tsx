import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import { withMockBackend } from "@/lib/testhelper/storybook"
import "@/ui/styles/index.css"

import { ListScreen } from "./ListScreen"

const meta: Meta<typeof ListScreen> = {
    title: "Screens/ListScreen",
    component: ListScreen,

    parameters: {
        layout: "fullscreen",
    },

    decorators: [
        withMockBackend({ generateMockData: true }),
        (Story) => (
            <main className="main pt-2 mx-auto">
                <Story />
            </main>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof ListScreen>

export const Main: Story = {}
