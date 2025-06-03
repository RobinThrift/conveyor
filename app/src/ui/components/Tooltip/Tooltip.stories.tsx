import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import { Button } from "../Button"
import { Tooltip, type TooltipProps } from "./Tooltip"

import "@/ui/styles/index.css"

const meta: Meta<typeof Tooltip> = {
    title: "Components/Tooltip",
    component: Tooltip,
    parameters: {
        controls: {
            exclude: ["children"],
        },
        layout: "centered",
    },
}

export default meta

type Story = StoryObj<typeof Tooltip>

export const Overview: Story = {
    name: "Tooltip",

    args: {
        content: faker.lorem.words({ min: 3, max: 8 }),
        placement: "bottom",
    },

    render: (args: TooltipProps) => (
        <div className="flex items-center gap-8">
            <Tooltip {...args}>
                <Button>Button with Tooltip</Button>
            </Tooltip>
        </div>
    ),
}
