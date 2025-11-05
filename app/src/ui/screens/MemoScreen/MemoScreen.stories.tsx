import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import { withMockBackend } from "@/lib/testhelper/storybook"
import "@/ui/styles/index.css"

import { MemoScreen } from "./MemoScreen"

const meta: Meta<typeof MemoScreen> = {
    title: "Screens/Memo",
    component: MemoScreen,

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
type Story = StoryObj<typeof MemoScreen>

export const Memo: Story = {}
