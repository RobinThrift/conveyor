import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu"
import clsx from "clsx"
import React from "react"

import { Button, type ButtonProps } from "@/ui/components//Button"
import { CaretDownIcon } from "@/ui/components/Icons"

export interface DropdownMenuProps {
    children: React.ReactNode | React.ReactNode[]

    className?: string
}

export function DropdownMenu(props: DropdownMenuProps) {
    return <RadixDropdownMenu.Root>{props.children}</RadixDropdownMenu.Root>
}

DropdownMenu.Trigger = DropdownMenuTrigger
DropdownMenu.Items = DropdownMenuItems
DropdownMenu.Item = DropdownMenuItem
DropdownMenu.ItemLabel = DropdownMenuItemLabel
DropdownMenu.ItemDescription = DropdownMenuItemDescription

export interface DropdownMenuTriggerProps extends ButtonProps {}

export function DropdownMenuTrigger(props: DropdownMenuTriggerProps) {
    return (
        <RadixDropdownMenu.Trigger asChild disabled={props.isDisabled}>
            <Button
                {...props}
                className={clsx("dropdown-menu-btn", props.className)}
                iconRight={props.iconRight ?? <CaretDownIcon />}
            />
        </RadixDropdownMenu.Trigger>
    )
}

export interface DropdownMenuItemsProps {
    className?: string
    children: React.ReactNode | React.ReactNode[]
    size?: "sm" | "md"
}

export function DropdownMenuItems(props: DropdownMenuItemsProps) {
    return (
        <RadixDropdownMenu.Portal>
            <RadixDropdownMenu.Content
                className={clsx(
                    "dropdown-menu-list",
                    props.size,
                    props.className,
                )}
                align="start"
            >
                {props.children}
            </RadixDropdownMenu.Content>
        </RadixDropdownMenu.Portal>
    )
}

export interface DropdownMenuItemProps {
    children: React.ReactNode | React.ReactNode[]
    className?: string

    destructive?: boolean
    disabled?: boolean

    action: () => void
}

export function DropdownMenuItem(props: DropdownMenuItemProps) {
    return (
        <RadixDropdownMenu.Item
            onSelect={props.action}
            className={clsx(
                "dropdown-menu-item",
                { destructive: props.destructive },
                props.className,
            )}
            disabled={props.disabled}
        >
            {props.children}
        </RadixDropdownMenu.Item>
    )
}

export interface DropdownMenuItemLabelProps {
    children: React.ReactNode | React.ReactNode[]
    icon?: React.ReactNode
    className?: string
}

export function DropdownMenuItemLabel(props: DropdownMenuItemLabelProps) {
    return (
        <div className="dropdown-menu-item-label">
            {props.icon && props.icon}
            {props.children}
        </div>
    )
}

export interface DropdownMenuItemDescriptionProps {
    children: React.ReactNode | React.ReactNode[]
    className?: string
}

export function DropdownMenuItemDescription(
    props: DropdownMenuItemDescriptionProps,
) {
    return (
        <div className={clsx("description", props.className)}>
            {props.children}
        </div>
    )
}
