import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { ListMemosPage } from "./ListMemosPage"

import "@/index.css"

const meta: Meta<typeof ListMemosPage> = {
    title: "Pages/Memos/List",
    component: ListMemosPage,
}

export default meta
type Story = StoryObj<typeof ListMemosPage>

export const List: Story = {
    args: {
        filter: {},
    },

    render: (args) => (
        <div className="container mx-auto">
            <ListMemosPage {...args} />
        </div>
    ),
}

export const Archive: Story = {
    args: {
        filter: {
            isArchived: true,
        },
    },

    render: (args) => (
        <div className="container mx-auto">
            <ListMemosPage {...args} />
        </div>
    ),
}

export const Bin: Story = {
    args: {
        filter: {
            isDeleted: true,
        },
    },

    render: (args) => (
        <div className="container mx-auto">
            <ListMemosPage {...args} />
        </div>
    ),
}
