import { lazy, memo } from "react"

export const InitSetupScreen = lazy(() =>
    import("./InitSetupScreen").then(({ InitSetupScreen }) => ({
        default: memo(InitSetupScreen),
    })),
)
