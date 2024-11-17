import type { Meta, StoryObj } from "@storybook/react"
import { Loader } from "./Loader"

import "@/index.css"

const meta: Meta<typeof Loader> = {
    title: "Components/Loader",
    component: Loader,
}

export default meta
type Story = StoryObj<typeof Loader>

export const Basic: Story = {
    name: "Loader",
    parameters: { layout: "centered" },
}
