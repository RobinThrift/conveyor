import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import React from "react"
import { Filters } from "./Filters"

import "@/index.css"

const meta: Meta<typeof Filters> = {
    title: "Components/Filters",
    component: Filters,

    argTypes: {
        onChangeFilter: { action: "onChangeFilters" },
    },
}

export default meta
type Story = StoryObj<typeof Filters>

export const Basic: Story = {
    name: "Filters",
    args: {
        filters: {},
        tags: {
            tags: [
                { tag: "tag-a", count: 1 },
                { tag: "tag-a/tag-a-0", count: 1 },
                { tag: "tag-a/tag-a-0/tag-a-0-a", count: 2 },
                { tag: "tag-a/tag-a-0/tag-a-0-b", count: 1 },
                { tag: "tag-a/tag-a-0/tag-a-0-b/tag-a-0-b-0", count: 5 },
                { tag: "tab-b/tag-b-0/tag-b-0-a", count: 1 },
                { tag: "tab-b/tag-b-0/tag-b-0-b", count: 10 },
                { tag: "tag-c", count: 100 },
                { tag: "tag-c/tag-c-0", count: 1 },
                { tag: "tag-c/tag-c-1/tag-c-1-a", count: 1 },
            ],
            isLoading: false,
            nextPage: fn(),
        },
    },
    render: (args) => (
        <div className="container mx-auto max-w-[300px]">
            <Filters {...args} />
        </div>
    ),
}
