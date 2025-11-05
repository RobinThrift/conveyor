import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"

import * as Icons from "./index"

const meta: Meta = {
    title: "Conveyor/Icons",
}

export default meta
type Story = StoryObj

export const AllIcons: Story = {
    name: "Icons",
    render: () => {
        return (
            <div>
                <ul className="grid grid-cols-8">
                    {Object.keys(Icons).map((name) => {
                        /* biome-ignore lint/performance/noDynamicNamespaceImportAccess: this is just a test file */
                        let Icon = Icons[name as keyof typeof Icons]
                        return (
                            <li
                                className="px-2 py-4 gap-2 flex flex-col items-center justify-center"
                                key={name}
                            >
                                <span className="text-sm">{name}</span>
                                <Icon className="size-8" />
                            </li>
                        )
                    })}
                </ul>
            </div>
        )
    },
}
