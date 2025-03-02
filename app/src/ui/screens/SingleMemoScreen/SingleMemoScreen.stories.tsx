import type { Meta, StoryObj } from "@storybook/react"

import { decorator } from "@/lib/testhelper/rootStore"
import "@/ui/styles/index.css"

import { SingleMemoScreen } from "./SingleMemoScreen"

const meta: Meta<typeof SingleMemoScreen> = {
    title: "Screens/Memos/Single",
    component: SingleMemoScreen,

    decorators: [decorator],
}

export default meta
type Story = StoryObj<typeof SingleMemoScreen>

export const Single: Story = {
    args: {
        memoID: "10-1",
    },
}
