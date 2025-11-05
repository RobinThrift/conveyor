import { useStore } from "@tanstack/react-store"
import React from "react"

import { stores } from "@/ui/stores"

import { useAppHeaderState } from "./state"

export function AppHeaderProvider() {
    let items = useAppHeaderState()
    let isReady = useStore(stores.unlock.status, (s) => s === "unlocked")
    if (!isReady) {
        return <nav className="appheader" data-tauri-drag-region />
    }

    return (
        <nav className="appheader" data-tauri-drag-region>
            <div className="sidebar-offset"></div>

            {items.left}
            {items.centre}
            {items.right}
        </nav>
    )
}
