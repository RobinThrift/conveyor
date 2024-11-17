import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import React from "react"
import { Filters } from "./Filters"

import "@/index.css"

const meta: Meta<typeof Filters> = {
    title: "Components/Filters",
    component: Filters,

    argTypes: {
        onChangeFilters: { action: "onChangeFilters" },
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
                "#tag-a",
                "#tag-a/tag-a-0",
                "#tag-a/tag-a-0/tag-a-0-a",
                "#tag-a/tag-a-0/tag-a-0-b",
                "#tag-a/tag-a-0/tag-a-0-b/tag-a-0-b-0",
                "#tab-b/tag-b-0/tag-b-0-a",
                "#tab-b/tag-b-0/tag-b-0-b",
                "#tag-c",
                "#tag-c/tag-c-0",
                "#tag-c/tag-c-1/tag-c-1-a",
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
