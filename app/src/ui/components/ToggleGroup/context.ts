import { createContext } from "react"

export type ToggleGroupContext = {
    focussed?: string
    selected?: string
    setValue: (value?: string) => void
}

export const toggleGroupContext = createContext<ToggleGroupContext | undefined>(undefined)
