import { lazy } from "react"

export const SettingsScreen = lazy(() =>
    import("./SettingsScreen").then(({ SettingsScreen }) => ({
        default: SettingsScreen,
    })),
)
