import React, { createContext } from "react"

export type RadioGroupContext = {
    focussed?: string
    selected?: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const radioGroupContext = createContext<RadioGroupContext | undefined>(undefined)
