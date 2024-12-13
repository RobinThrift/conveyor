import { Provider } from "@/state"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { SingleMemoPage } from "./SingleMemoPage"

import "@/index.css"

const meta: Meta<typeof SingleMemoPage> = {
    title: "Pages/Memos/Single",
    component: SingleMemoPage,

    decorators: (Story, { globals: { configureMockRootStore } }) => (
        <Provider store={configureMockRootStore()}>
            <Story />
        </Provider>
    ),
}

export default meta
type Story = StoryObj<typeof SingleMemoPage>

export const Single: Story = {
    args: {
        memoID: "10-1",
    },
}
