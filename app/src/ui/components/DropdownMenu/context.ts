import React, { createContext } from "react"

export type DropdownMenuItem = {
    id: string
    isDisabled: boolean
}

export type DropdownMenuContext = {
    targetID: string
    labelledByID: string
    popover: React.RefObject<HTMLDivElement | null>
    isOpen: boolean
    open: (src?: HTMLElement) => void
    close: () => void
    focussed: string
    focusFirstItem: () => void
    focusLastItem: () => void
    focusNextItem: () => void
    focusPrevItem: () => void

    activateFocussed: () => void

    items: DropdownMenuItem[]
    setItems: (items: DropdownMenuItem[]) => void

    onBeforeToggle: (e: React.ToggleEvent<HTMLDivElement>) => void
    onMouseEnterItem: (e: React.MouseEvent<HTMLElement>) => void

    preventFocusOnPress?: boolean
    preventFocus: React.RefObject<boolean>
}

export const dropdownMenuContext = createContext<DropdownMenuContext | undefined>(undefined)
