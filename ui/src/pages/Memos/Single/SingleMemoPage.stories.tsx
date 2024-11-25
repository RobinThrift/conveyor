import type { Meta, StoryObj } from "@storybook/react"
import { SingleMemoPage } from "./SingleMemoPage"

import "@/index.css"

const meta: Meta<typeof SingleMemoPage> = {
    title: "Pages/Memos/Single",
    component: SingleMemoPage,
}

export default meta
type Story = StoryObj<typeof SingleMemoPage>

export const Single: Story = {
    args: {
        memoID: "10-1",
    },
}
