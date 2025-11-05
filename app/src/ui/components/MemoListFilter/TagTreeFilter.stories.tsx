import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import { withMockBackend } from "@/lib/testhelper/storybook"

import "@/ui/styles/index.css"

import { TagTreeFilter } from "./TagTreeFilter"

const meta: Meta<typeof TagTreeFilter> = {
    title: "Components/MemoListFilter/TagTreeFilter",
    component: TagTreeFilter,
    parameters: {
        layout: "fullscreen",
    },
    decorators: [withMockBackend({ generateMockData: true })],
}

export default meta
type Story = StoryObj<typeof TagTreeFilter>

export const Overview: Story = {
    name: "TagTreeFilter",

    render: () => {
        return (
            <div
                className="w-full p-4 flex items-center justify-center gap-20"
                style={{ height: "100dvh" }}
            >
                <div className="py-1 rounded-lg bg-surface-level-2 border border-surface-border w-[300px] overflow-hidden h-full relative flex">
                    <TagTreeFilter />
                </div>
            </div>
        )
    },
}
