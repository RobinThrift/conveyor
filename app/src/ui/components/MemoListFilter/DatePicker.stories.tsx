import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import "@/ui/styles/index.css"

import { DatePicker } from "./DatePicker"

const meta: Meta<typeof DatePicker> = {
    title: "Components/MemoListFilter/DatePicker",
    component: DatePicker,
    parameters: {
        layout: "fullscreen",
    },
}

export default meta
type Story = StoryObj<typeof DatePicker>

export const Overview: Story = {
    name: "DatePicker",

    render: (args) => {
        return (
            <div className="w-full h-[100svh] flex items-center justify-center gap-20">
                <div className="p-1 rounded-lg bg-surface-level-1 border border-surface-border w-[300px]">
                    <DatePicker {...args} />
                </div>
            </div>
        )
    },
}
