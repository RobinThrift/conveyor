import { Archive, GearFine, Notepad, TrashSimple } from "@phosphor-icons/react"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { Sidebar } from "./Sidebar"

import "@/index.css"
import { faker } from "@faker-js/faker"

const meta: Meta<typeof Sidebar> = {
    title: "Components/Sidebar",
    component: Sidebar,
}

export default meta
type Story = StoryObj<typeof Sidebar>

export const Basic: Story = {
    name: "Sidebar",
    parameters: {
        layout: "fullscreen",
    },

    args: {
        className: "w-[250px] h-screen fixed",
        username: faker.person.firstName(),
        items: [
            {
                label: "Memos",
                url: "/memos",
                icon: <Notepad weight="duotone" />,
                isActive: true,
            },
            {
                label: "Archive",
                url: "/archive",
                icon: <Archive weight="duotone" />,
                isActive: false,
            },
            {
                label: "Bin",
                url: "/bin",
                icon: <TrashSimple weight="duotone" />,
                isActive: false,
            },
            {
                label: "Settings",
                url: "/settings",
                icon: <GearFine weight="duotone" />,
                isActive: false,
            },
        ],
    },
}
