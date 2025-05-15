import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { ConveyorBeltText } from "./ConveyorBeltText"

const meta: Meta<typeof ConveyorBeltText> = {
    title: "Components/ConveyorBeltText",
    component: ConveyorBeltText,
}

export default meta
type Story = StoryObj<typeof ConveyorBeltText>

export const Overview: Story = {
    name: "ConveyorBeltText",
    args: {
        children: "Conveyor",
    },

    parameters: {
        layout: "fullscreen",
    },

    render: (args) => (
        <div className="flex flex-col items-start justify-end max-w-screen max-h-screen">
            <ConveyorBeltText {...args} />
        </div>
    ),
}
