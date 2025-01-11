import {
    DotsThreeVertical,
    Pencil,
    TrashSimple,
    User,
} from "@phosphor-icons/react"
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu"
import { action } from "@storybook/addon-actions"
import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuItemDescription,
    DropdownMenuItemLabel,
    DropdownMenuItems,
    DropdownMenuTrigger,
} from "./DropdownMenu"

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
        children: [
            <DropdownMenuTrigger key="trigger">
                Dropdown Menu
            </DropdownMenuTrigger>,
            <DropdownMenuItems key="items">
                <DropdownMenuItem action={action("edit")}>
                    <DropdownMenuItemLabel icon={<Pencil />}>
                        Edit
                    </DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>
                        Edit the given field
                    </DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem action={action("disabled")} disabled>
                    <DropdownMenuItemLabel icon={<User />}>
                        Disabled
                    </DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>
                        {" "}
                        Do some action{" "}
                    </DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem action={action("delete")} destructive>
                    <DropdownMenuItemLabel icon={<TrashSimple />}>
                        Delete
                    </DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>
                        Delete the given field
                    </DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem
                    action={action("delete")}
                    destructive
                    disabled
                >
                    <DropdownMenuItemLabel icon={<TrashSimple />}>
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
                <DropdownMenu {...args} />
                <RadixDropdownMenu.Root modal={false} open={true}>
                    {args.children}
                </RadixDropdownMenu.Root>
            </div>
        )
    },
}

export const Variants: Story = {
    args: {
        children: [
            <DropdownMenuItems key="items">
                <DropdownMenuItem action={action("edit")}>
                    <DropdownMenuItemLabel icon={<Pencil />}>
                        Edit
                    </DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>
                        Edit the given field
                    </DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem action={action("disabled")} disabled>
                    <DropdownMenuItemLabel icon={<User />}>
                        Disabled
                    </DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>
                        {" "}
                        Do some action{" "}
                    </DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem action={action("delete")} destructive>
                    <DropdownMenuItemLabel icon={<TrashSimple />}>
                        Delete
                    </DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>
                        Delete the given field
                    </DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem
                    action={action("delete")}
                    destructive
                    disabled
                >
                    <DropdownMenuItemLabel icon={<TrashSimple />}>
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
                        <DropdownMenuTrigger variant="regular">
                            Regular
                        </DropdownMenuTrigger>
                        {args.children}
                    </DropdownMenu>

                    <DropdownMenu {...args}>
                        <DropdownMenuTrigger variant="primary">
                            Primary
                        </DropdownMenuTrigger>
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
                            iconRight={<DotsThreeVertical />}
                        />
                        {args.children}
                    </DropdownMenu>

                    <DropdownMenu {...args}>
                        <DropdownMenuTrigger
                            variant="primary"
                            plain
                            iconRight={<DotsThreeVertical />}
                        />
                        {args.children}
                    </DropdownMenu>
                </div>
            </div>
        )
    },
}
