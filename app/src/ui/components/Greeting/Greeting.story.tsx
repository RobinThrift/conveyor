import type { Meta, StoryObj } from "@storybook/react"
import { Greeting } from "./Greeting"

const meta: Meta<typeof Greeting> = {
    title: "Components/Greeting",
    component: Greeting,
}

export default meta
type Story = StoryObj<typeof Greeting>

export const Overview: Story = {
    name: "Greeting",
}
