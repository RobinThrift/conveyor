import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { Select } from "./Select"

import "@/ui/styles/index.css"

const meta: Meta<typeof Select> = {
    title: "Components/Select",
    component: Select,
}

export default meta

type Story = StoryObj<typeof Select>

export const Basic: Story = {
    name: "Select",
    argTypes: {
        onChange: { action: "onChange" },
    },
    args: {
        placeholder: "Please select a value",
        ariaLabel: "Value picker",
        name: "select-story",
        children: [
            <Select.Option key={"Value A"} value="Value A" useCheckbox>
                Value A
            </Select.Option>,
            <Select.Option key={"Value B"} value="Value B" useCheckbox>
                Value B
            </Select.Option>,
            <Select.Option key={"Value C"} value="Value C" useCheckbox>
                Value C
            </Select.Option>,
            <Select.Option key={"Value D"} value="Value D" disabled>
                Value D
            </Select.Option>,
            <Select.Option key={"Value E"} value="Value E">
                Value E
            </Select.Option>,
        ],
    },
}
