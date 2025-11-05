import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"
import { Alert } from "./Alert"

const meta: Meta<typeof Alert> = {
    title: "Components/Alert",
    component: Alert,
}

export default meta
type Story = StoryObj<typeof Alert>

export const Overview: Story = {
    name: "Alert",

    args: {
        children: faker.lorem.sentences({ min: 3, max: 10 }),
    },

    render: (args) => {
        return (
            <div className="container mx-auto">
                <Alert {...args} />
            </div>
        )
    },
}
