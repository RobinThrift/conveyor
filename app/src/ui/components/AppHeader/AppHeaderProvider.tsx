import { useStore } from "@tanstack/react-store"
import React from "react"

import { SlidersIcon } from "@/ui/components/Icons"
import { LinkButton } from "@/ui/components/Link"
import { useT } from "@/ui/i18n"
import { stores } from "@/ui/stores"

import { useAppHeaderState } from "./state"

export function AppHeaderProvider() {
    let t = useT("components/AppHeader")
    let items = useAppHeaderState()
    let isReady = useStore(stores.unlock.status, (s) => s === "unlocked")
    if (!isReady) {
        return <nav className="appheader" data-tauri-drag-region />
    }

    return (
        <nav className="appheader" data-tauri-drag-region>
            <LinkButton
                screen="settings"
                iconLeft={<SlidersIcon weight="duotone" />}
                className="settings-nav-button icon-only"
                outline
            >
                <span className="sr-only">{t.Settings}</span>
            </LinkButton>

            {items.left}
            {items.centre}
            {items.right}
        </nav>
    )
}
