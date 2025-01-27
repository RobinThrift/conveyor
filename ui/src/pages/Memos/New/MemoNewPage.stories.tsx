import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { Provider } from "@/state"

import "@/index.css"

import { MemoNewPage } from "./MemoNewPage"

const meta: Meta<typeof MemoNewPage> = {
    title: "Pages/Memos/New",
    component: MemoNewPage,

    parameters: {
        layout: "fullscreen",
    },

    decorators: (Story, { globals: { configureMockRootStore } }) => (
        <Provider store={configureMockRootStore()}>
            <Story />
        </Provider>
    ),
}

export default meta
type Story = StoryObj<typeof MemoNewPage>

export const New: Story = {}
