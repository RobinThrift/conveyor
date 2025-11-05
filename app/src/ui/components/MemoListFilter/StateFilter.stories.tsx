import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import "@/ui/styles/index.css"

import { StateFilter } from "./StateFilter"

const meta: Meta<typeof StateFilter> = {
    title: "Components/MemoListFilter/StateFilter",
    component: StateFilter,
    parameters: {
        layout: "fullscreen",
    },
}

export default meta
type Story = StoryObj<typeof StateFilter>

export const Overview: Story = {
    name: "StateFilter",

    render: (args) => {
        return (
            <div className="w-full h-[100svh] flex items-center justify-center gap-20">
                <div className="p-2 rounded-lg bg-surface-level-1 border border-surface-border w-[300px]">
                    <StateFilter {...args} />
                </div>
            </div>
        )
    },
}
