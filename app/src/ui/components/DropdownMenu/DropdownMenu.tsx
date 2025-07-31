import clsx from "clsx"
import React from "react"
import {
    Menu as AriaMenu,
    MenuItem as AriaMenuItem,
    MenuTrigger as AriaMenuTrigger,
    type MenuTriggerProps as AriaMenuTriggerProps,
    Popover as AriaPopover,
    Text as AriaText,
} from "react-aria-components"

import { Button, type ButtonProps } from "@/ui/components//Button"
import { CaretDownIcon } from "@/ui/components/Icons"

export type DropdownMenuProps = AriaMenuTriggerProps

export function DropdownMenu(props: DropdownMenuProps) {
    return <AriaMenuTrigger {...props} />
}

DropdownMenu.Trigger = DropdownMenuTrigger
DropdownMenu.Items = DropdownMenuItems
DropdownMenu.Item = DropdownMenuItem
DropdownMenu.ItemLabel = DropdownMenuItemLabel
DropdownMenu.ItemDescription = DropdownMenuItemDescription

export type DropdownMenuTriggerProps = ButtonProps

export function DropdownMenuTrigger(props: DropdownMenuTriggerProps) {
    return (
        <Button
            {...props}
            className={clsx("dropdown-menu-btn", props.className)}
            iconRight={props.iconRight ?? <CaretDownIcon />}
        />
    )
}

export interface DropdownMenuItemsProps {
    className?: string
    children: React.ReactNode | React.ReactNode[]
    size?: "sm" | "md"
}

export function DropdownMenuItems(props: DropdownMenuItemsProps) {
    return (
        <AriaPopover offset={0}>
            <AriaMenu
                className={clsx("dropdown-menu-list", props.size, props.className)}
                selectionMode="none"
            >
                {props.children}
            </AriaMenu>
        </AriaPopover>
    )
}

export interface DropdownMenuItemProps {
    children: React.ReactNode | React.ReactNode[]
    className?: string

    destructive?: boolean
    isDisabled?: boolean

    action: () => void
}

export function DropdownMenuItem(props: DropdownMenuItemProps) {
    return (
        <AriaMenuItem
            onAction={props.action}
            className={clsx(
                "dropdown-menu-item",
                { destructive: props.destructive },
                props.className,
            )}
            isDisabled={props.isDisabled}
        >
            {props.children}
        </AriaMenuItem>
    )
}

export interface DropdownMenuItemLabelProps {
    children: React.ReactNode | React.ReactNode[]
    icon?: React.ReactNode
    className?: string
}

export function DropdownMenuItemLabel(props: DropdownMenuItemLabelProps) {
    return (
        <AriaText slot="label" className="dropdown-menu-item-label">
            {props.icon && props.icon}
            {props.children}
        </AriaText>
    )
}

export interface DropdownMenuItemDescriptionProps {
    children: React.ReactNode | React.ReactNode[]
    className?: string
}

export function DropdownMenuItemDescription(props: DropdownMenuItemDescriptionProps) {
    return (
        <AriaText slot="description" className={clsx("description", props.className)}>
            {props.children}
        </AriaText>
    )
}
