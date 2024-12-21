import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { LinkPreview } from "./LinkPreview"

import "@/index.css"

const meta: Meta<typeof LinkPreview> = {
    title: "Components/LinkPreview",
    component: LinkPreview,
    decorators: [
        (Story) => (
            <div className="content">
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof LinkPreview>

export const Overview: Story = {
    args: {
        children: faker.internet.url(),
        img: faker.image.url({ width: 1200, height: 600 }),
        title: faker.lorem.sentences(1),
        description: faker.lorem.sentences({ min: 2, max: 6 }),
    },
}

export const MissingImage: Story = {
    args: {
        children: faker.internet.url(),
        title: faker.lorem.sentences(1),
        description: faker.lorem.sentences({ min: 2, max: 6 }),
    },
}

export const MissingImageAndDescription: Story = {
    args: {
        children: faker.internet.url(),
        title: faker.lorem.sentences(1),
    },
}
