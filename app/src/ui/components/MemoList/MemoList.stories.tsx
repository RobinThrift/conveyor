import type { Meta, StoryObj } from "@storybook/react-vite"

import { withMockBackend } from "@/lib/testhelper/storybook"
import "@/ui/styles/index.css"

import { MemoList } from "./MemoList"

const meta: Meta<typeof MemoList> = {
    title: "Components/MemoList",
    component: MemoList,
    decorators: [withMockBackend({ generateMockData: true })],
}

export default meta
type Story = StoryObj<typeof MemoList>

export const Overview: Story = {
    name: "MemoList",
}
