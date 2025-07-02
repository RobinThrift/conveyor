import type { Meta, StoryObj } from "@storybook/react-vite"
import React from "react"
import { action } from "storybook/actions"

import "@/ui/styles/index.css"

import { BinIcon, DotsThreeVerticalIcon, PencilIcon, UserIcon } from "@/ui/components/Icons"

import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuItemDescription,
    DropdownMenuItemLabel,
    DropdownMenuItems,
    DropdownMenuTrigger,
} from "./DropdownMenu"

const meta: Meta<typeof DropdownMenu> = {
    title: "Components/DropdownMenu",
    component: DropdownMenu,
}

export default meta

type Story = StoryObj<typeof DropdownMenu>

export const Basic: Story = {
    name: "DropdownMenu",
    args: {
        children: [
            <DropdownMenuTrigger key="trigger">Dropdown Menu</DropdownMenuTrigger>,
            <DropdownMenuItems key="items">
                <DropdownMenuItem action={action("edit")}>
                    <DropdownMenuItemLabel icon={<PencilIcon />}>Edit</DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>Edit the given field</DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem action={action("disabled")} isDisabled>
                    <DropdownMenuItemLabel icon={<UserIcon />}>Disabled</DropdownMenuItemLabel>
                    <DropdownMenuItemDescription> Do some action </DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem action={action("delete")} destructive>
                    <DropdownMenuItemLabel icon={<BinIcon />}>Delete</DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>
                        Delete the given field
                    </DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem action={action("delete")} destructive isDisabled>
                    <DropdownMenuItemLabel icon={<BinIcon />}>
                        Delete (Disabled)
                    </DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>
                        Disabled destructive action
                    </DropdownMenuItemDescription>
                </DropdownMenuItem>
            </DropdownMenuItems>,
        ],
    },

    render: (args) => {
        return (
            <div className="flex gap-3">
                <DropdownMenu {...args} defaultOpen={true} />
            </div>
        )
    },
}

export const Variants: Story = {
    args: {
        children: [
            <DropdownMenuItems key="items">
                <DropdownMenuItem action={action("edit")}>
                    <DropdownMenuItemLabel icon={<PencilIcon />}>Edit</DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>Edit the given field</DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem action={action("disabled")} isDisabled>
                    <DropdownMenuItemLabel icon={<UserIcon />}>Disabled</DropdownMenuItemLabel>
                    <DropdownMenuItemDescription> Do some action </DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem action={action("delete")} destructive>
                    <DropdownMenuItemLabel icon={<BinIcon />}>Delete</DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>
                        Delete the given field
                    </DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem action={action("delete")} destructive isDisabled>
                    <DropdownMenuItemLabel icon={<BinIcon />}>
                        Delete (Disabled)
                    </DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>
                        Disabled destructive action
                    </DropdownMenuItemDescription>
                </DropdownMenuItem>
            </DropdownMenuItems>,
        ],
    },

    render: (args) => {
        return (
            <div className="space-y-2">
                <div className="flex gap-2">
                    <DropdownMenu {...args}>
                        <DropdownMenuTrigger variant="regular">Regular</DropdownMenuTrigger>
                        {args.children}
                    </DropdownMenu>

                    <DropdownMenu {...args}>
                        <DropdownMenuTrigger variant="primary">Primary</DropdownMenuTrigger>
                        {args.children}
                    </DropdownMenu>
                </div>

                <div className="flex gap-2">
                    <DropdownMenu {...args}>
                        <DropdownMenuTrigger variant="regular" outline>
                            Outline Regular
                        </DropdownMenuTrigger>
                        {args.children}
                    </DropdownMenu>

                    <DropdownMenu {...args}>
                        <DropdownMenuTrigger variant="primary" outline>
                            Outline Primary
                        </DropdownMenuTrigger>
                        {args.children}
                    </DropdownMenu>
                </div>

                <div className="flex gap-2">
                    <DropdownMenu {...args}>
                        <DropdownMenuTrigger variant="regular" plain>
                            Plain Regular
                        </DropdownMenuTrigger>
                        {args.children}
                    </DropdownMenu>

                    <DropdownMenu {...args}>
                        <DropdownMenuTrigger variant="primary" plain>
                            Plain Primary
                        </DropdownMenuTrigger>
                        {args.children}
                    </DropdownMenu>
                </div>

                <div className="flex gap-2">
                    <DropdownMenu {...args}>
                        <DropdownMenuTrigger
                            variant="regular"
                            plain
                            iconRight={<DotsThreeVerticalIcon />}
                        />
                        {args.children}
                    </DropdownMenu>

                    <DropdownMenu {...args}>
                        <DropdownMenuTrigger
                            variant="primary"
                            plain
                            iconRight={<DotsThreeVerticalIcon />}
                        />
                        {args.children}
                    </DropdownMenu>
                </div>
            </div>
        )
    },
}
