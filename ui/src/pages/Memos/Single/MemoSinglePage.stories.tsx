import { Provider } from "@/state"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { MemoSinglePage } from "./MemoSinglePage"

import "@/index.css"

const meta: Meta<typeof MemoSinglePage> = {
    title: "Pages/Memos/Single",
    component: MemoSinglePage,

    decorators: (Story, { globals: { configureMockRootStore } }) => (
        <Provider store={configureMockRootStore()}>
            <Story />
        </Provider>
    ),
}

export default meta
type Story = StoryObj<typeof MemoSinglePage>

export const Single: Story = {
    args: {
        memoID: "10-1",
    },
}
