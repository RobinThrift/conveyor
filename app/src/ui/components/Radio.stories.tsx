import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"
import { RadioGroup, RadioItem } from "./Radio"

const meta: Meta<typeof RadioGroup> = {
    title: "Components/Input/Radio Group",
    component: RadioGroup,

    decorators: [
        (Story) => (
            <div className="flex items-center justify-center h-full w-full min-h-[400px]">
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof RadioGroup>

export const Overview: Story = {
    name: "Radio Group",

    args: {
        children: [
            <RadioItem key="0" label="Item 0" value="item0" />,
            <RadioItem key="1" label="Item 1" value="item1" />,
            <RadioItem key="2" label="Item 2" value="item2" />,
        ],
    },
}
