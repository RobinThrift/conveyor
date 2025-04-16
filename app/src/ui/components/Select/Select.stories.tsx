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
        label: "Value picker",
        name: "select-story",
        children: [
            <Select.Option key="value-a" value="value-a">
                Value A
            </Select.Option>,
            <Select.Option key="value-b" value="value-b">
                Value B
            </Select.Option>,
            <Select.Option key="value-c" value="value-c">
                Value C
            </Select.Option>,
            <Select.Group label="Group 2" key={"group"}>
                <Select.Option key="value-D" value="value-d" isDisabled>
                    Value D
                </Select.Option>
                <Select.Option key="value-e" value="value-e">
                    Value E
                </Select.Option>
            </Select.Group>,
        ],
    },
}
