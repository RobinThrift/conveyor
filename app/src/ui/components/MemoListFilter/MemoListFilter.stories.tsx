import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { generateMockMemos } from "@/lib/testhelper/memos"
import { decorator } from "@/lib/testhelper/rootStore"
import "@/ui/styles/index.css"

import { MemoListFilter } from "./MemoListFilter"

let { tags: mockTags } = generateMockMemos()

const meta: Meta<typeof MemoListFilter> = {
    title: "Components/MemoListFilter",
    component: MemoListFilter,
    args: {
        filter: {},
        tags: mockTags,
    },
    parameters: {
        layout: "fullscreen",
    },
    decorators: [
        decorator,
        (Story) => (
            <div className="mx-auto px-1 tablet:px-4 w-full max-w-[400px]">
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof MemoListFilter>

export const Overview: Story = {
    name: "MemoListFilter",
}
