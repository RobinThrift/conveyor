import { Button, type ButtonProps } from "@/components//Button"
import { CaretDown } from "@phosphor-icons/react"
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu"
import clsx from "clsx"
import React from "react"

export interface DropdownMenuProps extends ButtonProps {
    className?: string
    itemClassName?: string
    buttonClassName?: string

    ariaLabel?: string

    items: DropdownMenuItem[]

    // these are only really here for the storybook
    open?: boolean
    onOpenChange?: (isOpen: boolean) => void
    modal?: boolean
}

export type DropdownMenuItem = {
    label: string
    description?: string
    icon?: React.ReactNode

    destructive?: boolean
    disabled?: boolean

    className?: string
    action: () => void
}

export function DropdownMenu(props: DropdownMenuProps) {
    let modal = props.modal ?? false
    let disabled = props.disabled ?? props.items.length < 1
    return (
        <RadixDropdownMenu.Root
            open={props.open}
            onOpenChange={props.onOpenChange}
            modal={modal}
        >
            <RadixDropdownMenu.Trigger asChild disabled={disabled}>
                <Button
                    ariaLabel={props.ariaLabel}
                    variant={props.variant}
                    size={props.size}
                    outline={props.outline}
                    plain={props.plain}
                    className={clsx("dropdown-menu-btn", props.buttonClassName)}
                    iconLeft={props.iconLeft}
                    iconRight={props.iconRight ?? <CaretDown />}
                    disabled={disabled}
                >
                    {props.children}
                </Button>
            </RadixDropdownMenu.Trigger>

            <RadixDropdownMenu.Portal>
                <RadixDropdownMenu.Content
                    className={clsx("dropdown-menu-list", props.size)}
                    align="start"
                >
                    {props.items.map((item) => (
                        <MenuItem
                            key={item.label}
                            item={item}
                            className={props.itemClassName}
                        />
                    ))}
                </RadixDropdownMenu.Content>
            </RadixDropdownMenu.Portal>
        </RadixDropdownMenu.Root>
    )
}

function MenuItem({
    item,
    className,
}: {
    item: DropdownMenuItem
    className?: string
}) {
    return (
        <RadixDropdownMenu.Item
            onSelect={item.action}
            className={clsx(
                "dropdown-menu-item",
                { destructive: item.destructive },
                className,
                item.className,
            )}
            disabled={item.disabled}
        >
            <div className="flex items-center gap-2">
                {item.icon && item.icon}
                {item.label}
            </div>
            {item.description && (
                <div
                    className={clsx("description", {
                        "ps-5 ms-0.5 mt-1": item.icon,
                    })}
                >
                    {item.description}
                </div>
            )}
        </RadixDropdownMenu.Item>
    )
}
