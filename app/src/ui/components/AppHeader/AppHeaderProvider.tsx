import React from "react"

import { SlidersIcon } from "@/ui/components/Icons"
import { LinkButton } from "@/ui/components/Link"
import { useT } from "@/ui/i18n"
import { useAppHeaderState } from "./state"

export function AppHeaderProvider() {
    let t = useT("components/AppHeader")
    let items = useAppHeaderState()
    return (
        <header className="appheader" data-tauri-drag-region>
            <LinkButton
                screen="settings"
                iconLeft={<SlidersIcon />}
                className="settings-nav-button icon-only"
                outline
                stack="settings"
            >
                <span className="sr-only">{t.Settings}</span>
            </LinkButton>

            {items.left}
            {items.centre}
            {items.right}
        </header>
    )
}
