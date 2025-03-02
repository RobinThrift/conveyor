import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { decorator } from "@/lib/testhelper/rootStore"
import "@/ui/styles/index.css"

import { EditMemoScreen } from "./EditMemoScreen"

const meta: Meta<typeof EditMemoScreen> = {
    title: "Screens/Memos/Edit",
    component: EditMemoScreen,

    parameters: {
        layout: "fullscreen",
    },

    decorators: [
        decorator,
        (Story) => (
            <main className="container mx-auto">
                <Story />
            </main>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof EditMemoScreen>

export const Edit: Story = {
    args: {
        memoID: "10-1",
    },
}
