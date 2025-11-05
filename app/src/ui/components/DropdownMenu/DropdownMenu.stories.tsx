/** biome-ignore-all lint/correctness/useUniqueElementIds: this is just a story */
import type { Meta, StoryObj } from "@storybook/react-vite"
import React, { useEffect } from "react"
import { action } from "storybook/actions"

import "@/ui/styles/index.css"

import {
    BinIcon,
    CloudArrowUpIcon,
    CloudDeactivatedIcon,
    DotsThreeVerticalIcon,
    PencilIcon,
    SlidersIcon,
    TextBolderIcon,
} from "@/ui/components/Icons"

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
                <DropdownMenuItem id="edit" action={action("edit")}>
                    <DropdownMenuItemLabel icon={<PencilIcon />}>Edit</DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>Edit the given field</DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem id="disable-sync" action={action("disable-sync")}>
                    <DropdownMenuItemLabel icon={<CloudDeactivatedIcon />}>
                        Disable Sync
                    </DropdownMenuItemLabel>
                </DropdownMenuItem>

                <DropdownMenuItem id="disabled" action={action("disabled")} isDisabled>
                    <DropdownMenuItemLabel icon={<SlidersIcon />}>Disabled</DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>Do some action</DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem id="list" action={action("list")}>
                    <DropdownMenuItemLabel icon={<TextBolderIcon />}>List</DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>Show the list</DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem id="delete" action={action("delete")} destructive>
                    <DropdownMenuItemLabel icon={<BinIcon />}>Delete</DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>
                        Delete the given field
                    </DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem
                    id="delete-disabled"
                    action={action("delete")}
                    destructive
                    isDisabled
                >
                    <DropdownMenuItemLabel icon={<BinIcon />}>
                        Delete (Disabled)
                    </DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>
                        Disabled destructive action
                    </DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem id="upload" action={action("upload")}>
                    <DropdownMenuItemLabel icon={<CloudArrowUpIcon />}>
                        Upload
                    </DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>Upload Everything</DropdownMenuItemDescription>
                </DropdownMenuItem>
            </DropdownMenuItems>,
        ],
    },

    render: (args) => {
        return (
            <div className="flex flex-col items-center justify-center w-full min-h-[500px]">
                <DropdownMenu {...args} />
            </div>
        )
    },
}

export const Variants: Story = {
    args: {
        children: [
            <DropdownMenuItems key="items">
                <DropdownMenuItem id="edit" action={action("edit")}>
                    <DropdownMenuItemLabel icon={<PencilIcon />}>Edit</DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>Edit the given field</DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem id="disabled" action={action("disabled")} isDisabled>
                    <DropdownMenuItemLabel icon={<TextBolderIcon />}>
                        Disabled
                    </DropdownMenuItemLabel>
                    <DropdownMenuItemDescription> Do some action </DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem id="delete" action={action("delete")} destructive>
                    <DropdownMenuItemLabel icon={<BinIcon />}>Delete</DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>
                        Delete the given field
                    </DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem
                    id="delete-disabled"
                    action={action("delete")}
                    destructive
                    isDisabled
                >
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

                    <DropdownMenu {...args}>
                        <DropdownMenuTrigger variant="danger">
                            This has a very long label
                        </DropdownMenuTrigger>
                        {args.children}
                    </DropdownMenu>
                </div>

                <div className="flex gap-2">
                    <DropdownMenu {...args}>
                        <DropdownMenuTrigger
                            variant="regular"
                            iconRight={<DotsThreeVerticalIcon />}
                        />
                        {args.children}
                    </DropdownMenu>

                    <DropdownMenu {...args}>
                        <DropdownMenuTrigger
                            variant="primary"
                            iconRight={<DotsThreeVerticalIcon />}
                        />
                        {args.children}
                    </DropdownMenu>
                </div>
            </div>
        )
    },
}

let _logRaf: ReturnType<typeof requestAnimationFrame> | undefined

export const PreventFocusOnPress: Story = {
    args: {
        preventFocusOnPress: true,
        children: [
            <DropdownMenuTrigger key="trigger">Dropdown Menu</DropdownMenuTrigger>,
            <DropdownMenuItems key="items">
                <DropdownMenuItem id="edit" action={action("edit")}>
                    <DropdownMenuItemLabel icon={<PencilIcon />}>Edit</DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>Edit the given field</DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem id="disable-sync" action={action("disable-sync")}>
                    <DropdownMenuItemLabel icon={<CloudDeactivatedIcon />}>
                        Disable Sync
                    </DropdownMenuItemLabel>
                </DropdownMenuItem>

                <DropdownMenuItem id="disabled" action={action("disabled")} isDisabled>
                    <DropdownMenuItemLabel icon={<TextBolderIcon />}>
                        Disabled
                    </DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>Do some action</DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem id="list" action={action("list")}>
                    <DropdownMenuItemLabel icon={<TextBolderIcon />}>List</DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>Show the list</DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem id="delete" action={action("delete")} destructive>
                    <DropdownMenuItemLabel icon={<BinIcon />}>Delete</DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>
                        Delete the given field
                    </DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem
                    id="delete-disabled"
                    action={action("delete")}
                    destructive
                    isDisabled
                >
                    <DropdownMenuItemLabel icon={<BinIcon />}>
                        Delete (Disabled)
                    </DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>
                        Disabled destructive action
                    </DropdownMenuItemDescription>
                </DropdownMenuItem>

                <DropdownMenuItem id="upload" action={action("upload")}>
                    <DropdownMenuItemLabel icon={<CloudArrowUpIcon />}>
                        Upload
                    </DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>Upload Everything</DropdownMenuItemDescription>
                </DropdownMenuItem>
            </DropdownMenuItems>,
        ],
    },

    render: (args) => {
        useEffect(() => {
            let log = () => {
                if (_logRaf) {
                    cancelAnimationFrame(_logRaf)
                }

                _logRaf = requestAnimationFrame(() => {
                    console.log("Active Element:", document.activeElement)
                    _logRaf = undefined
                })
            }

            window.addEventListener("transitionend", log)

            return () => {
                window.removeEventListener("transitionend", log)

                if (_logRaf) {
                    cancelAnimationFrame(_logRaf)
                }
            }
        }, [])

        return (
            <div className="flex flex-col items-center justify-center w-full min-h-[500px]">
                <DropdownMenu {...args} />
            </div>
        )
    },
}
