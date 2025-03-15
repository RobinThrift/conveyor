import { lazy } from "react"

export const InitSetupScreen = lazy(() =>
    import("./InitSetupScreen").then(({ InitSetupScreen }) => ({
        default: InitSetupScreen,
    })),
)
