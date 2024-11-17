import {
    DotsThreeVertical,
    Pencil,
    TrashSimple,
    User,
} from "@phosphor-icons/react"
import { action } from "@storybook/addon-actions"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { DropdownMenu } from "./DropdownMenu"

import "@/index.css"

const meta: Meta<typeof DropdownMenu> = {
    title: "Components/DropdownMenu",
    component: DropdownMenu,
}

export default meta

type Story = StoryObj<typeof DropdownMenu>

export const Basic: Story = {
    name: "DropdownMenu",
    args: {
        items: [
            {
                label: "Edit",
                action: action("edit"),
                icon: <Pencil />,
                description: "Edit the given field",
            },
            {
                label: "Disabled",
                action: action("disabled"),
                disabled: true,
                icon: <User />,
                description: "Do some action",
            },
            {
                label: "Delete",
                action: action("delete"),
                destructive: true,
                icon: <TrashSimple />,
                description: "Delete the given field",
            },
            {
                label: "Delete (Disabled)",
                action: action("delete-disabled"),
                destructive: true,
                disabled: true,
                icon: <TrashSimple />,
                description: "Disabled destructive action",
            },
        ],

        iconRight: <DotsThreeVertical />,

        children: "Dropdown Menu",
    },

    render: (args) => {
        return (
            <div className="flex gap-3">
                <DropdownMenu {...args} />
                <DropdownMenu {...args} open={true} modal={false} />
            </div>
        )
    },
}

export const Variants: Story = {
    args: {
        items: [
            {
                label: "Edit",
                action: action("edit"),
                icon: <Pencil />,
            },
            {
                label: "Disabled",
                action: action("disabled"),
                disabled: true,
                icon: <User />,
            },
            {
                label: "Delete",
                action: action("delete"),
                destructive: true,
                icon: <TrashSimple />,
            },
            {
                label: "Delete (Disabled)",
                action: action("delete-disabled"),
                destructive: true,
                disabled: true,
                icon: <TrashSimple />,
            },
        ],
    },

    render: (args) => {
        return (
            <div className="space-y-2">
                <div className="flex gap-2">
                    <DropdownMenu {...args} variant="regular">
                        Regular
                    </DropdownMenu>
                    <DropdownMenu {...args} variant="primary">
                        Subtle
                    </DropdownMenu>
                </div>

                <div className="flex gap-2">
                    <DropdownMenu {...args} variant="regular" outline={true}>
                        Outline Regular
                    </DropdownMenu>
                    <DropdownMenu {...args} variant="primary" outline={true}>
                        Outline Subtle
                    </DropdownMenu>
                </div>

                <div className="flex gap-2">
                    <DropdownMenu {...args} variant="regular" plain={true}>
                        Regular
                    </DropdownMenu>
                    <DropdownMenu {...args} variant="primary" plain={true}>
                        Subtle
                    </DropdownMenu>
                </div>

                <div className="flex gap-2">
                    <DropdownMenu
                        {...args}
                        variant="regular"
                        plain={true}
                        iconRight={<DotsThreeVertical />}
                    />
                    <DropdownMenu
                        {...args}
                        variant="primary"
                        plain={true}
                        iconRight={<DotsThreeVertical />}
                    />
                </div>
            </div>
        )
    },
}
