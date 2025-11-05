import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import "@/ui/styles/index.css"

import { Checkbox } from "./Checkbox"

const meta: Meta<typeof Checkbox> = {
    title: "Components/Input",
    component: Checkbox,
}

export default meta
type Story = StoryObj<typeof Checkbox>

export const CheckboxOverview: Story = {
    name: "Checkbox",
    args: {
        label: "Basic Checkbox",
    },

    render: (args) => (
        <div className="flex flex-col items-center justify-center w-full h-screen">
            <Checkbox {...args} />
        </div>
    ),
}
