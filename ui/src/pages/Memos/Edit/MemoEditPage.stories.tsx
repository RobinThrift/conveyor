import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { Provider } from "@/state"

import "@/index.css"

import { MemoEditPage } from "./MemoEditPage"

const meta: Meta<typeof MemoEditPage> = {
    title: "Pages/Memos/Edit",
    component: MemoEditPage,

    parameters: {
        layout: "fullscreen",
    },

    decorators: (Story, { globals: { configureMockRootStore } }) => (
        <Provider store={configureMockRootStore()}>
            <main className="container mx-auto">
                <Story />
            </main>
        </Provider>
    ),
}

export default meta
type Story = StoryObj<typeof MemoEditPage>

export const Edit: Story = {
    args: {
        memoID: "10-1",
    },
}
