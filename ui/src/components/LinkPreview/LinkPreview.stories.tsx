import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { LinkPreview } from "./LinkPreview"

import "@/index.css"
import { generateTitle } from "@testhelper"

const meta: Meta<typeof LinkPreview> = {
    title: "Components/LinkPreview",
    component: LinkPreview,
    decorators: [
        (Story) => (
            <div className="content @container">
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
        title: generateTitle(),
        description: faker.lorem.sentences({ min: 1, max: 3 }),
    },
}

export const MissingImage: Story = {
    args: {
        children: faker.internet.url(),
        title: generateTitle(),
        description: faker.lorem.sentences({ min: 1, max: 3 }),
    },
}

export const MissingImageAndDescription: Story = {
    args: {
        children: faker.internet.url(),
        title: generateTitle(),
    },
}
