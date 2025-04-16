import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { decoratorWithMockData } from "@/lib/testhelper/rootStore"
import "@/ui/styles/index.css"

import { MemoListScreen } from "./MemoListScreen"

const meta: Meta<typeof MemoListScreen> = {
    title: "Screens/MemoList",
    component: MemoListScreen,

    parameters: {
        layout: "fullscreen",
    },

    decorators: [
        decoratorWithMockData,
        (Story) => (
            <main className="main pt-0 mx-auto w-screen flex">
                <Story />
            </main>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof MemoListScreen>

export const MemoList: Story = {}
