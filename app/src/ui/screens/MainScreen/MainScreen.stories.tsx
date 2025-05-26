import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { decoratorWithMockData } from "@/lib/testhelper/rootStore"
import "@/ui/styles/index.css"

import { MainScreen } from "./MainScreen"

const meta: Meta<typeof MainScreen> = {
    title: "Screens/Main",
    component: MainScreen,

    parameters: {
        layout: "fullscreen",
    },

    decorators: [
        decoratorWithMockData,
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
