import type { Meta, StoryObj } from "@storybook/react-vite"

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
}
