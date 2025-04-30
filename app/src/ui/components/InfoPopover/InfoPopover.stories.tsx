import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react"

import { InfoPopover } from "./InfoPopover"

import "@/ui/styles/index.css"

const meta: Meta<typeof InfoPopover> = {
    title: "Components/InfoPopover",
    component: InfoPopover,
    parameters: {
        layout: "centered",
    },
}

export default meta

type Story = StoryObj<typeof InfoPopover>

export const Overview: Story = {
    name: "InfoPopover",

    args: {
        children: faker.lorem.sentences({ min: 5, max: 10 }),
        placement: "bottom",
    },
}
