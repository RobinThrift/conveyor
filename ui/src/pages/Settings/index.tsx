import { lazy } from "react"

export type * from "./SettingsPage"

export const SettingsPage = lazy(() =>
    import("./SettingsPage").then(({ SettingsPage }) => ({
        default: SettingsPage,
    })),
)
