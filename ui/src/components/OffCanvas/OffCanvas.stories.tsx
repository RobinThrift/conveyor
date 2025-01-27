import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { OffCanvas } from "./OffCanvas"

import "@/index.css"

const meta: Meta<typeof OffCanvas> = {
    title: "Components/OffCanvas",
    component: OffCanvas,
}

export default meta
type Story = StoryObj<typeof OffCanvas>

export const Overview: Story = {
    name: "OffCanvas",
    args: {
        dismissible: true,
        modal: false,
        children: [
            <OffCanvas.Trigger key="trigger">Show OffCanvas</OffCanvas.Trigger>,
            <OffCanvas.Content key="content">
                <OffCanvas.Title>OffCanvas Story</OffCanvas.Title>
                <OffCanvas.Description>
                    {faker.lorem.sentence()}
                </OffCanvas.Description>

                {faker.lorem
                    .sentences({ min: 5, max: 10 })
                    .split(".")
                    .filter((sentence) => sentence.length !== 0)
                    .map((sentence) => (
                        <p key={sentence}>{sentence}.</p>
                    ))}
            </OffCanvas.Content>,
        ],
    },
}
