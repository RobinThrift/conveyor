import { lazy } from "react"

export type * from "./SettingsScreen"

export const SettingsScreen = lazy(() =>
    import("./SettingsScreen").then(({ SettingsScreen }) => ({
        default: SettingsScreen,
    })),
)
