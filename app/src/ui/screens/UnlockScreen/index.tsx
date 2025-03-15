import { lazy } from "react"

export const UnlockScreen = lazy(() =>
    import("./UnlockScreen").then(({ UnlockScreen }) => ({
        default: UnlockScreen,
    })),
)
