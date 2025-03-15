import type { Meta, StoryObj } from "@storybook/react"
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
        start: "B",
        middle: "e",
        end: "lt",
    },
}
