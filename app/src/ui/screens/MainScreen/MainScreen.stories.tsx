import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import { withMockBackend } from "@/lib/testhelper/storybook"
import "@/ui/styles/index.css"

import { MainScreen } from "./MainScreen"

const meta: Meta<typeof MainScreen> = {
    title: "Screens/Main",
    component: MainScreen,

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
type Story = StoryObj<typeof MainScreen>

export const Main: Story = {}
