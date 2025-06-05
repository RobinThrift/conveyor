import type { Meta, StoryObj } from "@storybook/react-vite"
import React, { useState } from "react"

import { Select } from "@/ui/components/Select"

import * as Icons from "./index"

const meta: Meta = {
    title: "Conveyor/Icons",
}

export default meta
type Story = StoryObj

type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone"

export const AllIcons: Story = {
    name: "Icons",
    render: () => {
        let [weight, setWeight] = useState<IconWeight>("light")

        return (
            <div>
                <Select
                    name="weight"
                    label="Weight"
                    value={weight}
                    className="w-fit mb-2"
                    onChange={(k) => setWeight((k ?? "regular") as IconWeight)}
                >
                    <Select.Option value="thin">Thin</Select.Option>
                    <Select.Option value="light">Light</Select.Option>
                    <Select.Option value="regular">Regular</Select.Option>
                    <Select.Option value="bold">Bold</Select.Option>
                    <Select.Option value="fill">Fill</Select.Option>
                    <Select.Option value="duotone">Duotone</Select.Option>
                </Select>

                <ul className="grid grid-cols-8">
                    {Object.keys(Icons).map((name) => {
                        let Icon = Icons[name as keyof typeof Icons]
                        return (
                            <li
                                className="px-2 py-4 gap-2 flex flex-col items-center justify-center"
                                key={name}
                            >
                                <span className="text-sm">{name}</span>
                                <Icon className="size-8" weight={weight} />
                            </li>
                        )
                    })}
                </ul>
            </div>
        )
    },
}
