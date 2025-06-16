import React, { createContext } from "react"

export type DialogContext = {
    ref: React.RefObject<HTMLDialogElement | null>
    isModal?: boolean
    isKeyboardDismissable?: boolean
    autofocus?: boolean
    labelledByID: string
    describedByID: string
    defaultOpen?: boolean
    isOpen: boolean
    open: () => void
    close: () => void
}

export const dialogContext = createContext<DialogContext | undefined>(undefined)
