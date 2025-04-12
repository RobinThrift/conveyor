import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"

import { Button } from "@/ui/components/Button"
import "@/ui/styles/index.css"

import { OffCanvas } from "./OffCanvas"

const meta: Meta<typeof OffCanvas> = {
    title: "Components/OffCanvas",
    component: OffCanvas,

    parameters: {
        layout: "fullscreen",
    },

    decorators: [
        (Story) => (
            <main className="w-screen h-screen p-4">
                <div className="mx-auto container">
                    <Story />
                    <h2 className="mt-2 py-2">More Content</h2>
                    {faker.lorem
                        .sentences({ min: 10, max: 15 })
                        .split(".")
                        .filter((sentence) => sentence.length !== 0)
                        .map((sentence) => (
                            <p key={sentence}>{sentence}.</p>
                        ))}
                </div>
            </main>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof OffCanvas>

export const Overview: Story = {
    name: "OffCanvas",
    args: {
        children: [
            <Button key="trigger">Show OffCanvas</Button>,
            <OffCanvas.Content key="content">
                <OffCanvas.Title>OffCanvas Story</OffCanvas.Title>

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
