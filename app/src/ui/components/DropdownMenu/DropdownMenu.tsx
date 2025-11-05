import clsx from "clsx"
import React, { useCallback, useContext, useEffect } from "react"

import { Button, type ButtonProps } from "@/ui/components/Button"
import { CaretDownIcon } from "@/ui/components/Icons"
import { type DropdownMenuItem as DropdownMenuItemT, dropdownMenuContext } from "./context"

import { useDropdownMenu } from "./useDropdownMenu"

export type DropdownMenuProps = {
    open?: boolean
    preventFocusOnPress?: boolean
    children: React.ReactNode | React.ReactNode[]
}

export function DropdownMenu(props: DropdownMenuProps) {
    let ctx = useDropdownMenu({ preventFocusOnPress: props.preventFocusOnPress })
    return <dropdownMenuContext.Provider value={ctx}>{props.children}</dropdownMenuContext.Provider>
}

DropdownMenu.Trigger = DropdownMenuTrigger
DropdownMenu.Items = DropdownMenuItems
DropdownMenu.Item = DropdownMenuItem
DropdownMenu.ItemLabel = DropdownMenuItemLabel
DropdownMenu.ItemDescription = DropdownMenuItemDescription

export type DropdownMenuTriggerProps = Omit<
    ButtonProps,
    "popoverTargetAction" | "popoverTarget" | "onClick" | "onKeyDown" | "preventFocusOnPress"
>

export function DropdownMenuTrigger(props: DropdownMenuTriggerProps) {
    let dropdownMenuCtx = useContext(dropdownMenuContext)
    let preventFocusOnPress = dropdownMenuCtx?.preventFocusOnPress ?? false

    let onKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLButtonElement>) => {
            switch (e.code) {
                case "Space":
                case "Enter":
                    e.preventDefault()
                    dropdownMenuCtx?.focusFirstItem()
                    dropdownMenuCtx?.open(e.target as HTMLElement)
                    break
                case "ArrowDown":
                    e.preventDefault()
                    dropdownMenuCtx?.focusFirstItem()
                    dropdownMenuCtx?.open(e.target as HTMLElement)
                    break
                case "ArrowUp":
                    e.preventDefault()
                    dropdownMenuCtx?.focusLastItem()
                    dropdownMenuCtx?.open(e.target as HTMLElement)
                    break
            }
        },
        [dropdownMenuCtx?.open, dropdownMenuCtx?.focusFirstItem, dropdownMenuCtx?.focusLastItem],
    )

    let onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLButtonElement>) => {
            if (!e.pointerType) {
                return
            }

            if (dropdownMenuCtx) {
                dropdownMenuCtx.preventFocus.current = true
            }

            e.preventDefault()
            e.stopPropagation()
        },
        [dropdownMenuCtx],
    )

    if (!dropdownMenuCtx) {
        throw new Error(
            "<DropdownMenuTrigger> component called outside of <DropdownMenu> component",
        )
    }

    return (
        <Button
            {...props}
            id={dropdownMenuCtx.labelledByID}
            onPointerDown={preventFocusOnPress ? onPointerDown : undefined}
            popoverTargetAction="toggle"
            popoverTarget={dropdownMenuCtx.targetID}
            onKeyDown={onKeyDown}
            className={clsx(
                "dropdown-menu-btn",
                { "is-open": dropdownMenuCtx.isOpen },
                props.className,
            )}
            iconRight={props.iconRight ?? <CaretDownIcon />}
        />
    )
}

export interface DropdownMenuItemsProps {
    className?: string
    children: React.ReactNode | React.ReactNode[]
}

export function DropdownMenuItems(props: DropdownMenuItemsProps) {
    let dropdownMenuCtx = useContext(dropdownMenuContext)
    if (!dropdownMenuCtx) {
        throw new Error("<DropdownMenuItems> component called outside of <DropdownMenu> component")
    }

    useEffect(() => {
        let items: DropdownMenuItemT[] = []

        React.Children.forEach(props.children, (c) => {
            if (typeof c !== "object") {
                return
            }

            let el = c as React.ReactElement<DropdownMenuItemProps>
            if (el.type === DropdownMenuItem) {
                items.push({ id: el.props.id, isDisabled: el.props.isDisabled ?? false })
            }
        })

        dropdownMenuCtx.setItems(items)
    }, [props.children, dropdownMenuCtx.setItems])

    let onKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLUListElement>) => {
            switch (e.code) {
                case "Space":
                case "Enter":
                    e.preventDefault()
                    dropdownMenuCtx?.activateFocussed()
                    break
                case "ArrowUp":
                    e.preventDefault()
                    dropdownMenuCtx?.focusPrevItem()
                    break
                case "ArrowDown":
                    e.preventDefault()
                    dropdownMenuCtx?.focusNextItem()
                    break
            }
        },
        [
            dropdownMenuCtx?.activateFocussed,
            dropdownMenuCtx?.focusPrevItem,
            dropdownMenuCtx?.focusNextItem,
        ],
    )

    return (
        <div
            className="dropdown-menu-popover"
            id={dropdownMenuCtx.targetID}
            ref={dropdownMenuCtx.popover}
            popover="auto"
            role="presentation"
            onBeforeToggle={dropdownMenuCtx.onBeforeToggle}
        >
            <ul
                // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: follows the best pracices example
                role="menu"
                aria-labelledby={dropdownMenuCtx.labelledByID}
                tabIndex={-1}
                aria-activedescendant={dropdownMenuCtx.focussed}
                className={clsx("dropdown-menu-list", props.className)}
                onKeyDown={onKeyDown}
            >
                {props.children}
            </ul>
        </div>
    )
}

export interface DropdownMenuItemProps {
    children: React.ReactNode | React.ReactNode[]
    id: string
    className?: string

    destructive?: boolean
    isDisabled?: boolean

    action: () => void
}

export function DropdownMenuItem({ isDisabled = false, ...props }: DropdownMenuItemProps) {
    let dropdownMenuCtx = useContext(dropdownMenuContext)
    if (!dropdownMenuCtx) {
        throw new Error("<DropdownMenuItem> component called outside of <DropdownMenu> component")
    }

    let onClick = useCallback(
        (e: React.PointerEvent<HTMLLIElement>) => {
            e.stopPropagation()
            e.preventDefault()

            requestAnimationFrame(() => {
                dropdownMenuCtx.close()
                props.action()
            })
        },
        [dropdownMenuCtx.close, props.action],
    )

    let onKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLElement>) => {
            if (e.code === "Space" || e.code === "Enter") {
                dropdownMenuCtx.close()
                props.action()
            }
        },
        [dropdownMenuCtx.close, props.action],
    )

    return (
        <li
            // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: follows the best pracices example
            role="menuitem"
            id={props.id}
            onMouseEnter={!isDisabled ? dropdownMenuCtx.onMouseEnterItem : undefined}
            onClick={!isDisabled ? onClick : undefined}
            onKeyDown={!isDisabled ? onKeyDown : undefined}
            tabIndex={-1}
            aria-disabled={isDisabled}
            className={clsx(
                "dropdown-menu-item",
                {
                    "has-focus": dropdownMenuCtx.focussed === props.id,
                    destructive: props.destructive,
                },
                props.className,
            )}
        >
            {props.children}
        </li>
    )
}

export interface DropdownMenuItemLabelProps {
    children: React.ReactNode | React.ReactNode[]
    icon?: React.ReactNode
    className?: string
}

export function DropdownMenuItemLabel(props: DropdownMenuItemLabelProps) {
    return (
        <span slot="label" className="dropdown-menu-item-label">
            {props.icon && (
                <span className="icon" aria-hidden="true">
                    {props.icon}
                </span>
            )}
            {props.children}
        </span>
    )
}

export interface DropdownMenuItemDescriptionProps {
    children: React.ReactNode | React.ReactNode[]
    className?: string
}

export function DropdownMenuItemDescription(props: DropdownMenuItemDescriptionProps) {
    return (
        <span slot="description" className={clsx("description", props.className)}>
            {props.children}
        </span>
    )
}
