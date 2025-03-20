import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { Button } from "../Button"
import { DateTime } from "../DateTime"
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

export const Bottom: Story = {
    args: {
        content: faker.lorem.words({ min: 3, max: 8 }),
        placement: "bottom",
    },

    render,
}

export const Top: Story = {
    args: {
        content: faker.lorem.words({ min: 3, max: 8 }),
        placement: "top",
    },
    render,
}

function render(args: TooltipProps) {
    return (
        <div className="flex items-center gap-8">
            <Tooltip {...args}>
                <Button>Button with Tooltip</Button>
            </Tooltip>

            <Tooltip {...args}>
                <DateTime date={faker.date.recent()} />
            </Tooltip>

            <Tooltip {...args}>
                <span>
                    <code>span</code> Element with Tooltip
                </span>
            </Tooltip>
        </div>
    )
}
