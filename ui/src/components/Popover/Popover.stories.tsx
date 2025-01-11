import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { Popover } from "./Popover"

const meta: Meta<typeof Popover> = {
    title: "Components/Popover",
    component: Popover,
}

export default meta
type Story = StoryObj<typeof Popover>

export const Overview: Story = {
    name: "Popover",
    args: {
        children: [
            <Popover.Trigger key="trigger">Popover</Popover.Trigger>,
            <Popover.Content key="content">
                {faker.lorem
                    .sentences({ min: 5, max: 10 })
                    .split(".")
                    .filter((sentence) => sentence.length !== 0)
                    .map((sentence) => (
                        <p key={sentence}>{sentence}.</p>
                    ))}
            </Popover.Content>,
        ],
    },
}
