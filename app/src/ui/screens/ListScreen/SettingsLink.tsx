import React from "react"

import { SlidersIcon } from "@/ui/components/Icons"
import { Link } from "@/ui/components/Link"
import { useT } from "@/ui/i18n"

export function SettingsLink() {
    let t = useT("components/Sidebar")

    return (
        <Link className="btn settings-nav-button icon-only" screen="settings">
            <span className="icon">
                <SlidersIcon />
            </span>
            <span className="sr-only">{t.SettingsLink}</span>
        </Link>
    )
}
