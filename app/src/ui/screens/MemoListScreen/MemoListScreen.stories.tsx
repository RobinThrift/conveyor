import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import { withMockBackend } from "@/lib/testhelper/storybook"
import "@/ui/styles/index.css"

import { MemoListScreen } from "./MemoListScreen"

const meta: Meta<typeof MemoListScreen> = {
    title: "Screens/MemoList",
    component: MemoListScreen,

    parameters: {
        layout: "fullscreen",
    },

    decorators: [
        withMockBackend({ generateMockData: true }),
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
