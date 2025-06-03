import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react-vite"

import "@/ui/styles/index.css"

import { DateTime } from "./DateTime"

const meta: Meta<typeof DateTime> = {
    title: "Components/DateTime",
    component: DateTime,
}

export default meta

type Story = StoryObj<typeof DateTime>

export const Basic: Story = {
    name: "DateTime",
    args: {
        date: faker.date.past({ years: 1 }),
    },
}

export const Relative: Story = {
    args: {
        date: faker.date.recent(),
        relative: true,
    },
}

export const InvalidDateTime: Story = {
    args: {
        date: "123001235t8128" as any,
    },
}
