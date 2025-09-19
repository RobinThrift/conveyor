import React, { createContext } from "react"

export type AlertDialogContext = {
    ref: React.RefObject<HTMLDialogElement | null>
    labelledByID: string
    describedByID: string
    defaultOpen?: boolean
    isOpen: boolean
    open: () => void
    close: () => void
}

export const alertDialogContext = createContext<AlertDialogContext | undefined>(undefined)
