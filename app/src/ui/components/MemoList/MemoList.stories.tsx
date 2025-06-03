import type { Meta, StoryObj } from "@storybook/react-vite"

import { decoratorWithMockData } from "@/lib/testhelper/rootStore"
import "@/ui/styles/index.css"

import { MemoList } from "./MemoList"

const meta: Meta<typeof MemoList> = {
    title: "Components/MemoList",
    component: MemoList,
    decorators: [decoratorWithMockData],
}

export default meta
type Story = StoryObj<typeof MemoList>

export const Overview: Story = {
    name: "MemoList",
}
