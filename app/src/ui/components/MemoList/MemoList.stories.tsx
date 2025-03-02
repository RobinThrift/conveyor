import { action } from "@storybook/addon-actions"
import type { Meta, StoryObj } from "@storybook/react"

import { generateMockMemos } from "@/lib/testhelper/memos"
import { decorator } from "@/lib/testhelper/rootStore"
import "@/ui/styles/index.css"

import { MemoList } from "./MemoList"

const meta: Meta<typeof MemoList> = {
    title: "Components/MemoList",
    component: MemoList,
    decorators: [decorator],
}

export default meta
type Story = StoryObj<typeof MemoList>

let { memos: mockMemos } = generateMockMemos()

export const Overview: Story = {
    name: "MemoList",
    args: {
        memos: mockMemos,
        actions: {
            edit: action("edit"),
            archive: action("archive"),
            delete: action("delete"),
        },
    },
}
