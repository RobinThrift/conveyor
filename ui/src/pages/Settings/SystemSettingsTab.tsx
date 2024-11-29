import { useT } from "@/i18n"
import React from "react"

export const SystemSettingsTab = React.forwardRef<HTMLDivElement>(
    function SystemSettingsTab(_, forwardedRef) {
        let t = useT("pages/Settings/SystemSettingsTab")
        return (
            <div ref={forwardedRef} className="settings-tab">
                <div className="settings-tab-section">
                    <h2>{t.Title}</h2>
                </div>
            </div>
        )
    },
)
