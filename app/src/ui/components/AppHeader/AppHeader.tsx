import React from "react"
import { useAddToAppHeader } from "./state"

export const AppHeader = React.memo(function AppHeader({
    id,
    position,
    children,
}: React.PropsWithChildren<{
    id: React.Key
    position: "left" | "right" | "centre"
}>) {
    useAddToAppHeader({
        [position]: <React.Fragment key={id}>{children}</React.Fragment>,
    })
    return null
})
