import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import { generateMockMemos } from "@/lib/testhelper/memos"
import { withMockBackend } from "@/lib/testhelper/storybook"

import "@/ui/styles/index.css"

import { AppHeaderProvider } from "../AppHeader"
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
    decorators: [withMockBackend({ generateMockData: true })],
}

export default meta
type Story = StoryObj<typeof MemoListFilter>

export const Overview: Story = {
    name: "MemoListFilter",

    render: () => {
        return (
            <div className="mx-auto px-1 tablet:px-4 w-full max-w-[400px]">
                <AppHeaderProvider />
                <MemoListFilter />
            </div>
        )
    },
}
