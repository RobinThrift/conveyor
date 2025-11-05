import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"
import { Temporal } from "temporal-polyfill"

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
    render: (args) => {
        let now = Temporal.Now.zonedDateTimeISO(Temporal.Now.timeZoneId())
        return (
            <div className="flex flex-col gap-2">
                <DateTime {...args} date={now.subtract({ seconds: 2 })} relative />
                <DateTime {...args} date={now.subtract({ seconds: 15 })} relative />

                <DateTime {...args} date={now.subtract({ minutes: 1 })} relative />
                <DateTime {...args} date={now.subtract({ minutes: 10 })} relative />
                <DateTime {...args} date={now.subtract({ minutes: 59 })} relative />

                <DateTime {...args} date={now.subtract({ hours: 1 })} relative />
                <DateTime {...args} date={now.subtract({ hours: 2 })} relative />
                <DateTime {...args} date={now.subtract({ hours: 23 })} relative />

                <DateTime {...args} date={now.subtract({ hours: 23, minutes: 59 })} relative />

                <DateTime {...args} date={now.subtract({ days: 1 })} relative />
                <DateTime {...args} date={now.subtract({ days: 2 })} relative />
                <DateTime {...args} date={now.subtract({ days: 3 })} relative />
                <DateTime {...args} date={now.subtract({ days: 4 })} relative />
            </div>
        )
    },
}

export const InvalidDateTime: Story = {
    args: {
        date: "abcdefghij" as any,
    },
}
